import { createClient } from "@/lib/supabase/server";
import type {
  Database,
  Prospect,
  ProspectRow,
  ProspectScan,
  ProspectScanRow,
} from "@/lib/supabase/database.types";
import type { ProspectRecord, ProspectScanExecutionResult } from "./types";

export async function getProspectScans(
  limit = 50,
): Promise<ProspectScan[]> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("prospect_scans")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getProspectScanById(
  id: string,
): Promise<ProspectScan | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("prospect_scans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getProspects(options: {
  limit?: number;
  scanId?: string;
} = {}): Promise<Prospect[]> {
  const supabase = await createClient<Database>();
  let query = supabase
    .from("prospects")
    .select("*")
    .order("qualification_score", { ascending: false })
    .limit(options.limit ?? 100);

  if (options.scanId) {
    query = query.eq("scan_id", options.scanId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getProspectById(
  id: string,
): Promise<Prospect | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getProspectSummary(): Promise<{
  total: number;
  qualified: number;
  disqualified: number;
  auditPending: number;
}> {
  const supabase = await createClient<Database>();
  const { count: total, error } = await supabase
    .from("prospects")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw new Error(error.message);
  }

  const [qualifiedResult, disqualifiedResult, auditPendingResult] =
    await Promise.all([
      supabase
        .from("prospects")
        .select("id", { count: "exact", head: true })
        .eq("prospect_status", "QUALIFIED"),
      supabase
        .from("prospects")
        .select("id", { count: "exact", head: true })
        .eq("prospect_status", "DISQUALIFIED"),
      supabase
        .from("prospects")
        .select("id", { count: "exact", head: true })
        .eq("prospect_status", "AUDIT_PENDING"),
  ]);

  return {
    total: total ?? 0,
    qualified: qualifiedResult.count ?? 0,
    disqualified: disqualifiedResult.count ?? 0,
    auditPending: auditPendingResult.count ?? 0,
  };
}

export async function createProspectScan(input: {
  location: string;
  radiusKm: number | null;
  industries: string[];
  categories: string[];
  maxProspects: number;
  exclusions: string[];
  sourceConfig: Record<string, unknown>;
  userId: string;
}): Promise<ProspectScan> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("prospect_scans")
    .insert({
      location: input.location,
      radius_km: input.radiusKm,
      industries: input.industries,
      categories: input.categories,
      max_prospects: input.maxProspects,
      exclusions: input.exclusions,
      source_config: input.sourceConfig,
      status: "DRAFT",
      created_by: input.userId,
      errors: [],
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function prospectRecordToRow(
  prospect: ProspectRecord,
  scanId: string,
): Partial<ProspectRow> {
  return {
    business_name: prospect.businessName,
    website_url: prospect.websiteUrl,
    domain: prospect.domain,
    industry: prospect.industry,
    industry_subtype: prospect.industrySubtype,
    city: prospect.city,
    state: prospect.state,
    country: prospect.country,
    address: prospect.address,
    phone: prospect.phone,
    public_email: prospect.publicEmail,
    contact_page_url: prospect.contactPageUrl,
    social_urls: prospect.socialUrls,
    discovery_source: prospect.discoverySource,
    discovered_at: prospect.discoveredAt,
    scan_id: scanId,
    source_url: prospect.sourceUrl,
    source_metadata: prospect.sourceMetadata,
    duplicate_fingerprint: prospect.duplicateFingerprint,
    appears_active: prospect.appearsActive,
    local_business: prospect.localBusiness,
    location_count: prospect.locationCount,
    review_presence: prospect.reviewPresence,
    review_count: prospect.reviewCount,
    rating: prospect.rating,
    service_summary: prospect.serviceSummary,
    business_description: prospect.businessDescription,
    confidence: prospect.confidence,
    website_present: prospect.websitePresent,
    website_reachable: prospect.websiteReachable,
    https_present: prospect.httpsPresent,
    mobile_responsive: prospect.mobileResponsive,
    page_count_estimate: prospect.pageCountEstimate,
    broken_links: prospect.brokenLinks,
    contact_cta_present: prospect.contactCtaPresent,
    phone_cta_present: prospect.phoneCtaPresent,
    contact_form_present: prospect.contactFormPresent,
    portfolio_present: prospect.portfolioPresent,
    testimonials_present: prospect.testimonialsPresent,
    last_modified_at: prospect.lastModifiedAt,
    visual_audit_status: prospect.visualAuditStatus,
    audit_notes: prospect.auditNotes,
    audit_timestamp: prospect.auditTimestamp,
    email_found: prospect.emailFound,
    email: prospect.email,
    email_source_url: prospect.emailSourceUrl,
    phone_found: prospect.phoneFound,
    contact_page_found: prospect.contactPageFound,
    contactability_confidence: prospect.contactabilityConfidence,
    prospect_status: prospect.prospectStatus,
    qualification_score: prospect.qualificationScore,
    website_opportunity_score: prospect.websiteOpportunityScore,
    business_quality_score: prospect.businessQualityScore,
    contactability_score: prospect.contactabilityScore,
    disqualification_reasons: prospect.disqualificationReasons,
    qualification_reasons: prospect.qualificationReasons,
  };
}

export async function persistProspectScanResult(
  scanId: string,
  result: ProspectScanExecutionResult,
): Promise<void> {
  const supabase = await createClient<Database>();
  const rows = result.prospects.map((prospect) =>
    prospectRecordToRow(prospect, scanId),
  );

  const { error: updateError } = await supabase
    .from("prospect_scans")
    .update({
      status: "COMPLETED",
      discovered_count: result.counters.discoveredCount,
      audited_count: result.counters.auditedCount,
      qualified_count: result.counters.qualifiedCount,
      disqualified_count: result.counters.disqualifiedCount,
      error_count: result.counters.errorCount,
      completed_at: new Date().toISOString(),
    })
    .eq("id", scanId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("prospects").insert(rows);
    if (insertError) {
      throw new Error(insertError.message);
    }
  }
}

export async function markProspectScanRunning(scanId: string): Promise<void> {
  const supabase = await createClient<Database>();
  const { error } = await supabase
    .from("prospect_scans")
    .update({
      status: "RUNNING",
      started_at: new Date().toISOString(),
    })
    .eq("id", scanId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function markProspectScanFailed(
  scanId: string,
  message: string,
): Promise<void> {
  const supabase = await createClient<Database>();
  const { error } = await supabase
    .from("prospect_scans")
    .update({
      status: "FAILED",
      errors: [message],
      completed_at: new Date().toISOString(),
    })
    .eq("id", scanId);

  if (error) {
    throw new Error(error.message);
  }
}

export function scanRowToInput(scan: ProspectScanRow) {
  return {
    location: scan.location,
    radiusKm: scan.radius_km,
    industries: scan.industries ?? [],
    categories: scan.categories ?? [],
    maxProspects: scan.max_prospects,
    exclusions: scan.exclusions ?? [],
    sourceConfig: scan.source_config ?? {},
  };
}
