import type {
  BusinessResearch,
  IndustryClassification,
} from "./types";

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  "AI Website Design": [
    "mint chip",
    "website generation",
    "website service",
    "managed website service",
    "ai website",
    "website design",
    "managed website",
    "web design",
    "website service",
    "modern websites",
    "websites",
  ],
  Roofing: ["roof", "roofing", "shingle", "gutter"],
  Landscaping: ["landscap", "lawn", "sod", "irrigation"],
  "Home Remodeling": ["remodel", "renovation", "kitchen", "bathroom"],
  Plumbing: ["plumb", "drain", "water heater", "pipe"],
  Electrical: ["electric", "wiring", "panel", "lighting"],
  HVAC: ["hvac", "heating", "cooling", "air conditioning"],
  Painting: ["paint", "painting", "drywall"],
  Photography: ["photograph", "photo", "portrait", "headshot"],
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
}

export function classifyIndustry(
  research: BusinessResearch,
  knownIndustry?: string | null,
): IndustryClassification {
  if (knownIndustry?.trim()) {
    return {
      primaryIndustry: knownIndustry.trim(),
      subtype: "",
      confidence: 1,
      alternateIndustry: null,
      exception: null,
      matchedKeywords: ["known-project-industry"],
    };
  }

  const corpus = normalize(
    [
      research.businessName,
      research.description ?? "",
      research.services.join(" "),
      research.valueProposition ?? "",
      research.headline ?? "",
    ].join(" "),
  );

  let primaryIndustry: string | null = null;
  let subtype = "";
  let confidence = 0;
  let matchedKeywords: string[] = [];

  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    const matches = keywords.filter((keyword) =>
      corpus.includes(normalize(keyword)),
    );
    if (matches.length > matchedKeywords.length) {
      primaryIndustry = industry;
      subtype = "";
      confidence = Math.min(0.95, 0.45 + matches.length * 0.18);
      matchedKeywords = matches;
    }
  }

  if (!primaryIndustry) {
    return {
      primaryIndustry: "Unclassified",
      subtype: "",
      confidence: 0,
      alternateIndustry: null,
      exception: "Low confidence industry classification; manual review required.",
      matchedKeywords: [],
    };
  }

  return {
    primaryIndustry,
    subtype,
    confidence,
    alternateIndustry: confidence < 0.65 ? "General Local Business" : null,
    exception: confidence < 0.55 ? "Industry confidence is materially low." : null,
    matchedKeywords,
  };
}
