export type SchemaValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateAgainstSchema(
  value: unknown,
  schema: unknown,
): SchemaValidationResult {
  if (!isRecord(schema)) {
    return { ok: false, error: "Output schema is invalid." };
  }

  const type = schema.type;

  if (type === "string") {
    return typeof value === "string"
      ? { ok: true }
      : { ok: false, error: "Expected a string value." };
  }

  if (type === "boolean") {
    return typeof value === "boolean"
      ? { ok: true }
      : { ok: false, error: "Expected a boolean value." };
  }

  if (type === "number") {
    return typeof value === "number" && Number.isFinite(value)
      ? { ok: true }
      : { ok: false, error: "Expected a number value." };
  }

  if (type === "array") {
    if (!Array.isArray(value)) {
      return { ok: false, error: "Expected an array value." };
    }

    if (isRecord(schema.items) && schema.items.type === "string") {
      for (const item of value) {
        if (typeof item !== "string") {
          return {
            ok: false,
            error: "Expected every array item to be a string.",
          };
        }
      }
    }

    return { ok: true };
  }

  if (type === "object") {
    if (!isRecord(value)) {
      return { ok: false, error: "Expected an object value." };
    }

    const required = Array.isArray(schema.required) ? schema.required : [];

    for (const key of required) {
      if (typeof key !== "string" || value[key] === undefined) {
        return {
          ok: false,
          error: `Missing required field '${String(key)}'.`,
        };
      }
    }

    if (isRecord(schema.properties)) {
      for (const [key, propertySchema] of Object.entries(schema.properties)) {
        const propertyValue = value[key];

        if (propertyValue === undefined) {
          continue;
        }

        const result = validateAgainstSchema(propertyValue, propertySchema);

        if (!result.ok) {
          return { ok: false, error: `Field '${key}': ${result.error}` };
        }
      }
    }

    return { ok: true };
  }

  // Unknown schema types are intentionally lenient.
  return { ok: true };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
