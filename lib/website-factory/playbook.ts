import type { IndustryPlaybook } from "@/lib/playbooks/types";
import type {
  IndustryClassification,
  PlaybookSelectionProvider,
} from "./types";

export function fixturePlaybook(
  industryName: string,
): IndustryPlaybook {
  return {
    schemaVersion: 1,
    industryName,
    industryOverview: `${industryName} fixture playbook.`,
    typicalBusinessProfile: "Small, locally operated business.",
    targetCustomer: "Local customers seeking a trusted provider.",
    buyingPsychology: "Clarity, trust, and an easy next step.",
    customerPriorities: ["Clear services", "Proof of trust", "Easy contact"],
    painPoints: ["Hard-to-find information", "No obvious next step"],
    commonObjections: ["Unclear pricing", "Unknown quality"],
    trustSignals: ["Real reviews", "Licenses or certifications"],
    primaryConversionGoals: ["GENERATE_LEADS"],
    ctaPatterns: ["Get a quote", "Call now", "Contact us"],
    onePageStructure: [
      "Hero",
      "Services",
      "About",
      "Reviews",
      "Contact",
    ],
    fivePageStructure: ["Home", "Services", "About", "Reviews", "Contact"],
    contentStrategy: "Concise, direct local-business copy.",
    messagingGuidance: "Lead with the value and a clear action.",
    visualDesignGuidance: "Clean, credible, and locally relevant.",
    typographyGuidance: "Modern sans with strong hierarchy.",
    colorGuidance: "Clear contrast with restrained accents.",
    photographyAssetGuidance: "Use real business imagery when available.",
    aiAssetOpportunities: ["Hero artwork", "Decorative graphics"],
    motionInteractionGuidance: "Subtle motion only.",
    mobilePriorities: ["Fast load", "Clear tap targets", "Prominent CTA"],
    seoLocalSearchGuidance: "Include location and services.",
    accessibilityComplianceNotes: ["Sufficient contrast", "Keyboard navigation"],
    commonWebsiteMistakes: ["Too many sections", "Generic card grids"],
    designClichesToAvoid: ["SaaS dashboard visuals", "Generic gradients"],
    creativeOpportunities: ["Local-specific texture", "Distinct section rhythm"],
    evidenceSources: [
      { url: "fixture://playbook", note: "Deterministic fixture playbook." },
    ],
    confidenceAssumptions: ["Fixture data; not live-verified."],
  };
}

export class FixturePlaybookProvider implements PlaybookSelectionProvider {
  async select(classification: IndustryClassification): Promise<{
    playbook: IndustryPlaybook | null;
    artifactVersionId: string | null;
  }> {
    return {
      playbook: fixturePlaybook(classification.primaryIndustry),
      artifactVersionId: `fixture-playbook-${classification.primaryIndustry
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}`,
    };
  }
}

