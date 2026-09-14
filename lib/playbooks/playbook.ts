import {
  INDUSTRY_PLAYBOOK_FIELDS,
  INDUSTRY_PLAYBOOK_SCHEMA_VERSION,
} from "./constants";
import type { IndustryPlaybook } from "./types";

export const INDUSTRY_PLAYBOOK_OUTPUT_SCHEMA: Record<string, unknown> =
  buildOutputSchema();

function buildOutputSchema(): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    schemaVersion: { type: "number" },
    industryName: { type: "string" },
  };
  const required: string[] = ["schemaVersion", "industryName"];

  for (const field of INDUSTRY_PLAYBOOK_FIELDS) {
    required.push(field.key);
    if (field.kind === "string") {
      properties[field.key] = { type: "string" };
    } else if (field.kind === "stringArray") {
      properties[field.key] = { type: "array", items: { type: "string" } };
    } else {
      properties[field.key] = {
        type: "array",
        items: {
          type: "object",
          required: ["url", "note"],
          properties: { url: { type: "string" }, note: { type: "string" } },
        },
      };
    }
  }

  return { type: "object", required, properties };
}

export type IndustryPlaybookValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

export function validateIndustryPlaybook(
  value: unknown,
): IndustryPlaybookValidationResult {
  if (!isRecord(value)) {
    return { ok: false, errors: ["Industry playbook must be an object."] };
  }

  const playbook = value as unknown as Record<string, unknown>;
  const errors: string[] = [];

  if (playbook.schemaVersion !== INDUSTRY_PLAYBOOK_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${INDUSTRY_PLAYBOOK_SCHEMA_VERSION}.`);
  }
  if (typeof playbook.industryName !== "string" || !playbook.industryName.trim()) {
    errors.push("industryName is required.");
  }

  for (const field of INDUSTRY_PLAYBOOK_FIELDS) {
    const item = playbook[field.key];
    if (field.kind === "string") {
      if (typeof item !== "string") {
        errors.push(`${field.key} must be a string.`);
      }
    } else if (field.kind === "stringArray") {
      if (!Array.isArray(item) || item.some((entry) => typeof entry !== "string")) {
        errors.push(`${field.key} must be an array of strings.`);
      }
    } else {
      if (!Array.isArray(item)) {
        errors.push(`${field.key} must be an array.`);
      } else {
        for (const source of item) {
          if (!isRecord(source) || typeof source.url !== "string" || typeof source.note !== "string") {
            errors.push(`${field.key} entries require url and note strings.`);
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true };
}

export function industryPlaybookTitle(industryName: string): string {
  return `${industryName} Industry Playbook`;
}

export function buildIndustryPlaybookSummary(playbook: IndustryPlaybook): string {
  return [
    `Industry: ${playbook.industryName.trim() || "Unnamed"}`,
    `Overview: ${playbook.industryOverview.trim() || "—"}`,
    `One-page structure: ${playbook.onePageStructure.join(" → ") || "—"}`,
    `Five-page structure: ${playbook.fivePageStructure.join(" → ") || "—"}`,
    `Sources: ${playbook.evidenceSources.length}`,
    `Assumptions: ${playbook.confidenceAssumptions.length}`,
  ].join("\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
