export function formatSkillSourceType(value: string): string {
  return titleCase(value);
}

export function formatToolRiskLevel(value: string): string {
  return titleCase(value);
}

export function formatPermissionLevel(value: string): string {
  return titleCase(value);
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
