import { ARTIFACT_TYPE_OPTIONS } from "./constants";

export function formatArtifactType(value: string): string {
  return (
    ARTIFACT_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

export function formatArtifactStatus(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
