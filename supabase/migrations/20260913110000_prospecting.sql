-- MintChipOS autonomous prospecting foundation.
-- This migration creates the business-domain scan and prospect tables only.
-- It does not implement outreach, demos, payments, or deployment.

create table public.prospect_scans (
  id uuid primary key default gen_random_uuid(),
  location text not null,
  radius_km numeric,
  industries jsonb not null default '[]'::jsonb,
  categories jsonb not null default '[]'::jsonb,
  max_prospects integer not null default 100,
  exclusions jsonb not null default '[]'::jsonb,
  status text not null default 'DRAFT',
  source_config jsonb not null default '{}'::jsonb,
  discovered_count integer not null default 0,
  audited_count integer not null default 0,
  qualified_count integer not null default 0,
  disqualified_count integer not null default 0,
  error_count integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  constraint prospect_scans_status_check check (
    status in ('DRAFT', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')
  ),
  constraint prospect_scans_max_prospects_check check (
    max_prospects between 1 and 250
  )
);

create index prospect_scans_created_at_idx
  on public.prospect_scans(created_at desc);

create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  website_url text,
  domain text,
  industry text,
  industry_subtype text,
  city text,
  state text,
  country text,
  address text,
  phone text,
  public_email text,
  contact_page_url text,
  social_urls jsonb not null default '[]'::jsonb,
  discovery_source text not null,
  discovered_at timestamptz,
  scan_id uuid references public.prospect_scans(id) on delete set null,
  source_url text,
  source_metadata jsonb not null default '{}'::jsonb,
  duplicate_fingerprint text not null,
  appears_active boolean,
  local_business boolean,
  location_count integer,
  review_presence boolean,
  review_count integer,
  rating numeric,
  service_summary text,
  business_description text,
  confidence numeric,
  website_present boolean not null default false,
  website_reachable boolean not null default false,
  https_present boolean not null default false,
  mobile_responsive boolean,
  page_count_estimate integer not null default 0,
  broken_links jsonb not null default '[]'::jsonb,
  contact_cta_present boolean not null default false,
  phone_cta_present boolean not null default false,
  contact_form_present boolean not null default false,
  portfolio_present boolean not null default false,
  testimonials_present boolean not null default false,
  last_modified_at timestamptz,
  visual_audit_status text not null default 'NOT_INSPECTED',
  audit_notes jsonb not null default '[]'::jsonb,
  audit_timestamp timestamptz,
  email_found boolean not null default false,
  email text,
  email_source_url text,
  phone_found boolean not null default false,
  contact_page_found boolean not null default false,
  contactability_confidence numeric,
  prospect_status text not null default 'DISCOVERED',
  qualification_score integer not null default 0,
  website_opportunity_score integer not null default 0,
  business_quality_score integer not null default 0,
  contactability_score integer not null default 0,
  disqualification_reasons jsonb not null default '[]'::jsonb,
  qualification_reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prospects_status_check check (
    prospect_status in (
      'DISCOVERED',
      'AUDIT_PENDING',
      'QUALIFIED',
      'DISQUALIFIED',
      'READY_FOR_DEMO',
      'DEMO_GENERATED',
      'OUTREACH_READY',
      'OUTREACH_SENT',
      'CONVERTED',
      'ARCHIVED'
    )
  ),
  constraint prospects_discovery_source_check check (
    discovery_source in (
      'FIXTURE',
      'USER_LIST',
      'SEARCH_ENGINE',
      'BUSINESS_DIRECTORY',
      'MAP_LISTING',
      'DATA_PROVIDER',
      'MANUAL'
    )
  ),
  constraint prospects_visual_audit_status_check check (
    visual_audit_status in ('NOT_INSPECTED', 'BASIC', 'FAILED')
  ),
  constraint prospects_scores_check check (
    qualification_score between 0 and 100
    and website_opportunity_score between 0 and 100
    and business_quality_score between 0 and 100
    and contactability_score between 0 and 100
  )
);

create index prospects_scan_id_idx on public.prospects(scan_id);
create index prospects_domain_idx on public.prospects(domain);
create index prospects_duplicate_fingerprint_idx on public.prospects(duplicate_fingerprint);
create index prospects_status_idx on public.prospects(prospect_status);

alter table public.prospect_scans enable row level security;
alter table public.prospects enable row level security;

create policy "Prospect scans are readable by authenticated users"
  on public.prospect_scans for select to authenticated using (true);

create policy "Prospect scans are insertable by authenticated users"
  on public.prospect_scans for insert to authenticated with check (true);

create policy "Prospect scans are updatable by authenticated users"
  on public.prospect_scans for update to authenticated using (true);

create policy "Prospects are readable by authenticated users"
  on public.prospects for select to authenticated using (true);

create policy "Prospects are insertable by authenticated users"
  on public.prospects for insert to authenticated with check (true);

create policy "Prospects are updatable by authenticated users"
  on public.prospects for update to authenticated using (true);

