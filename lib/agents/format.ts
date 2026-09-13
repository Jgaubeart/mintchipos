export function formatRunStatus(value: string): string {
  return titleCase(value);
}

export function formatTriggerType(value: string): string {
  return titleCase(value);
}

export function formatRelationship(value: string): string {
  return titleCase(value);
}

export function formatJson(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
