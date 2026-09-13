import { validateAgainstSchema } from "./schema";

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

  if (outputSchema) {
    const result = validateAgainstSchema(output, outputSchema);

    if (!result.ok) {
      return { ok: false, error: result.error };
    }
  }

  return { ok: true, output };
}
