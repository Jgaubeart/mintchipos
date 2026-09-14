import type {
  AssetAudit,
  AssetPlan,
  BusinessResearch,
  CreativeDirection,
  DesignBrief,
  UxContentStrategy,
} from "./types";

export function buildUxContentStrategy(input: {
  brief: DesignBrief;
  research: BusinessResearch;
}): UxContentStrategy {
  const sections = [...input.brief.siteFormat.selectedItems];
  if (sections.length === 0) {
    sections.push("Hero", "Services", "Contact");
  }

  return {
    storytellingFlow:
      "Open with a direct value statement, prove local credibility, then make the next step impossible to miss.",
    sectionSequence: sections,
    sectionPurpose: Object.fromEntries(
      sections.map((section, index) => [
        section,
        index === 0
          ? "Establish what the business does and why it matters."
          : "Build trust and guide the visitor toward action.",
      ]),
    ),
    messagingHierarchy: [
      "Clear value proposition",
      "Proof of local trust",
      "Specific services",
      "Primary call to action",
    ],
    headlineStrategy:
      input.research.headline ??
      `${input.research.businessName} — clear, confident local service.`,
    contentOutline: sections.map((section) => `${section}: concise local copy`),
    ctaPlacement: ["Hero", "Contact", "Sticky mobile CTA"],
    trustPlacement: ["Below hero", "Near service list", "Before final CTA"],
    mobileFlow:
      "Hero → services → trust → contact, with a persistent mobile call button.",
    draftCopyDirection:
      "Short sentences. Local keywords. One clear action per section.",
    contentGaps: input.research.services.length === 0
      ? ["Service details are not yet discovered."]
      : [],
  };
}

export function buildCreativeDirection(input: {
  brief: DesignBrief;
  research: BusinessResearch;
  strategy: UxContentStrategy;
}): CreativeDirection {
  return {
    centralVisualConcept: `Credible local craft for ${input.research.businessName}.`,
    narrativeConcept:
      "A focused local-business story that feels designed, not templated.",
    sectionComposition: input.strategy.sectionSequence.map((section, index) =>
      index === 0
        ? "Full-width hero with a strong headline and immediate action."
        : `Distinct ${section} section with clear hierarchy and breathing room.`,
    ),
    sectionOrder: [...input.strategy.sectionSequence],
    hierarchy: ["Headline", "Supporting proof", "Action"],
    typographySystem: "Modern sans with restrained scale and strong spacing.",
    colorApplication:
      "High-contrast base palette with one disciplined accent color.",
    imageryStrategy:
      "Prefer real business imagery; use clearly labeled demo placeholders otherwise.",
    graphicMotifs: ["Local texture", "Simple service iconography"],
    backgroundTreatment: "Quiet neutral backgrounds with deliberate contrast.",
    shapeLanguage: input.brief.visualLanguage.shapeLanguage || "MIXED",
    motionDirection: "Subtle reveals only.",
    mobileComposition: "Single-column, fast scanning, persistent action.",
    ctaPresentation: "Clear, repeated, and consistent call to action.",
    customAssetsNeeded: ["Hero placeholder", "Service icons"],
    antiPatterns: [
      "Generic SaaS dashboard visuals",
      "Endless card grids",
      "Meaningless gradients",
    ],
  };
}

export function buildAssetAudit(
  research: BusinessResearch,
): AssetAudit {
  return {
    summary:
      "Deterministic asset audit. Public images are reference-only until usage rights are confirmed.",
    items: research.images.map((image, index) => ({
      id: `asset-${index + 1}`,
      assetType: "IMAGE",
      sourceUrl: image,
      provenance: "BUSINESS_OWNED_PUBLIC",
      dimensions: null,
      format: null,
      qualityAssessment: "Not verified",
      classification: "IMPROVE",
      demoOnly: true,
      productionStatus: "UNVERIFIED",
      usageRightsStatus: "UNKNOWN",
    })),
  };
}

export function buildAssetPlan(input: {
  creative: CreativeDirection;
  audit: AssetAudit;
}): AssetPlan {
  const planned = [
    "Hero artwork or representative photo",
    "Service icons",
    "Local texture or decorative graphic",
    "Social/OG image",
    ...input.creative.customAssetsNeeded,
  ];

  return {
    plannedAssets: planned,
    visualLanguageRule:
      "Every generated or selected asset shares the same restrained, credible visual language.",
    generationBlocked: true,
    placeholderStrategy:
      "Use clearly labeled demo placeholders so the rest of the factory can run without paid asset generation.",
  };
}
