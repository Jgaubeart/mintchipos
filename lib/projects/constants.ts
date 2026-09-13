export const PROJECT_TYPES = ["INTERNAL", "CUST"] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_TYPE_OPTIONS: {
  value: ProjectType;
  label: string;
}[] = [
  { value: "INTERNAL", label: "Internal" },
  { value: "CUST", label: "Customer" },
];
