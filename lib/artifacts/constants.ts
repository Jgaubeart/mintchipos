export const ARTIFACT_TYPES = [
  "BRIEF",
  "RESEARCH",
  "WEBSITE_AUDIT",
  "POSITIONING",
  "BRAND_DIRECTION",
  "UX_ARCHITECTURE",
  "COPY",
  "CREATIVE_DIRECTION",
  "INTERACTION_SPEC",
  "BUILD_PLAN",
  "VISUAL_QA",
  "FUNCTIONAL_QA",
  "LAUNCH_INFO",
  "DESIGN_DIRECTION_BRIEF",
  "PLAYBOOK_BRIEF",
  "INDUSTRY_PLAYBOOK",
] as const;

export type ArtifactType = (typeof ARTIFACT_TYPES)[number];

export const ARTIFACT_TYPE_OPTIONS: {
  value: ArtifactType;
  label: string;
}[] = [
  { value: "BRIEF", label: "Brief" },
  { value: "RESEARCH", label: "Research" },
  { value: "WEBSITE_AUDIT", label: "Website Audit" },
  { value: "POSITIONING", label: "Positioning" },
  { value: "BRAND_DIRECTION", label: "Brand Direction" },
  { value: "UX_ARCHITECTURE", label: "UX Architecture" },
  { value: "COPY", label: "Copy" },
  { value: "CREATIVE_DIRECTION", label: "Creative Direction" },
  { value: "INTERACTION_SPEC", label: "Interaction Specification" },
  { value: "BUILD_PLAN", label: "Build Plan" },
  { value: "VISUAL_QA", label: "Visual QA" },
  { value: "FUNCTIONAL_QA", label: "Functional QA" },
  { value: "LAUNCH_INFO", label: "Launch Information" },
  { value: "DESIGN_DIRECTION_BRIEF", label: "Design Direction Brief" },
  { value: "PLAYBOOK_BRIEF", label: "Playbook Brief" },
  { value: "INDUSTRY_PLAYBOOK", label: "Industry Playbook" },
];

export const ARTIFACT_STATUSES = [
  "DRAFT",
  "READY_FOR_REVIEW",
  "APPROVED",
  "SUPERSEDED",
  "ARCHIVED",
] as const;

export type ArtifactStatus = (typeof ARTIFACT_STATUSES)[number];

export const ARTIFACT_CREATOR_TYPES = ["USER", "AGENT", "SYSTEM"] as const;

export type ArtifactCreatorType = (typeof ARTIFACT_CREATOR_TYPES)[number];
