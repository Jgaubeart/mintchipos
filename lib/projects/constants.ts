export const PROJECT_TYPES = ["INTERNAL", "CUSTOMER", "PREVIEW"] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_TYPE_OPTIONS: {
  value: ProjectType;
  label: string;
}[] = [
  { value: "INTERNAL", label: "Internal" },
  { value: "CUSTOMER", label: "Customer" },
  { value: "PREVIEW", label: "Preview" },
];
