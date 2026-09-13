export const SKILL_SOURCE_TYPES = ["INTERNAL", "EXTERNAL", "DERIVED"] as const;

export type SkillSourceType = (typeof SKILL_SOURCE_TYPES)[number];

export const TOOL_RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export type ToolRiskLevel = (typeof TOOL_RISK_LEVELS)[number];

export const TOOL_PERMISSION_LEVELS = [
  "READ",
  "EXECUTE",
  "MUTATE",
  "DEPLOY",
] as const;

export type ToolPermissionLevel = (typeof TOOL_PERMISSION_LEVELS)[number];

export const TOOL_PERMISSION_LEVEL_OPTIONS: {
  value: ToolPermissionLevel;
  label: string;
}[] = [
  { value: "READ", label: "Read" },
  { value: "EXECUTE", label: "Execute" },
  { value: "MUTATE", label: "Mutate" },
  { value: "DEPLOY", label: "Deploy" },
];
