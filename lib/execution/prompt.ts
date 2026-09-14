export function buildStructuredOutputInstructions(
  outputSchema: unknown,
): string {
  const serialized = JSON.stringify(outputSchema, null, 2) ?? "{}";
  const required = getRequiredFields(outputSchema);
  const requiredLine =
    required.length > 0
      ? `Required top-level fields: ${required.join(", ")}`
      : "Required top-level fields: none";

  return [
    "OUTPUT REQUIREMENTS",
    "",
    "Return ONLY valid JSON.",
    "Do not use markdown.",
    "Do not add explanatory prose.",
    "Do not rename fields.",
    "Do not add substitute fields.",
    "The response MUST conform exactly to this JSON schema:",
    "",
    serialized,
    "",
    requiredLine,
    "",
    "If a value is unknown:",
    '- use an honest placeholder appropriate to the schema, such as "Unknown from provided context"',
    "- or an empty array where appropriate",
    "- never omit required fields",
  ].join("\n");
}

function getRequiredFields(schema: unknown): string[] {
  if (typeof schema === "object" && schema !== null) {
    const required = (schema as Record<string, unknown>).required;

    if (Array.isArray(required)) {
      return required.filter((field): field is string => typeof field === "string");
    }
  }

  return [];
}
