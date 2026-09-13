export type ExecutionAcknowledgement = {
  acknowledged: boolean;
  projectName: string;
  summary: string;
};

export type ValidationResult =
  | { ok: true; data: ExecutionAcknowledgement }
  | { ok: false; error: string };

export function validateExecutionAcknowledgement(
  value: unknown,
): ValidationResult {
  if (!isRecord(value)) {
    return { ok: false, error: "Hermes output must be an object." };
  }

  const acknowledged = value.acknowledged;
  const projectName = value.projectName ?? value.project_name;
  const summary = value.summary;

  if (typeof acknowledged !== "boolean") {
    return { ok: false, error: "Hermes output is missing a boolean 'acknowledged' field." };
  }

  if (typeof projectName !== "string" || projectName.trim().length === 0) {
    return { ok: false, error: "Hermes output is missing a non-empty 'projectName' field." };
  }

  if (typeof summary !== "string" || summary.trim().length === 0) {
    return { ok: false, error: "Hermes output is missing a non-empty 'summary' field." };
  }

  return {
    ok: true,
    data: {
      acknowledged,
      projectName: projectName.trim(),
      summary: summary.trim(),
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
