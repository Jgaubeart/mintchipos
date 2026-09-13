export function normalizeStructuredOutput(
  output: unknown,
  outputSchema?: unknown,
): unknown {
  if (!outputSchema) {
    return output;
  }

  if (typeof output !== "string") {
    return output;
  }

  const trimmed = output.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // Fall through to fenced-block detection.
  }

  const fencedJson = extractFencedJsonBlock(trimmed);

  if (fencedJson !== null) {
    try {
      return JSON.parse(fencedJson);
    } catch {
      // Fall through to returning the original trimmed string.
    }
  }

  return trimmed;
}

function extractFencedJsonBlock(value: string): string | null {
  const match = value.match(/```(?:json)?[^\S\n]*\n?([\s\S]*?)\n?```/i);

  if (!match || match[1] === undefined) {
    return null;
  }

  return match[1].trim();
}
