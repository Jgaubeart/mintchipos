export type ValidationResult =
  | { ok: true; output: unknown }
  | { ok: false; error: string };

export function validateAgentOutput(
  output: unknown,
  outputSchema?: Record<string, unknown> | null,
): ValidationResult {
  if (output === null || output === undefined) {
    return { ok: false, error: "Hermes output is missing." };
  }

  // Future schema-specific agents can validate `output` against
  // `outputSchema` here. Generic runs intentionally accept any non-null
  // Hermes output (string, object, array, number, or boolean).
  if (outputSchema) {
    // Reserved for explicit output schema validation.
  }

  return { ok: true, output };
}
