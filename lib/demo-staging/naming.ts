import {
  DEFAULT_PREVIEW_DOMAIN,
  PREVIEW_SLUG_MAX_LENGTH,
} from "./constants";
import type { PreviewSlugInput, PreviewSlugResult } from "./types";

function normalizeSlugBase(value: string): string {
  const normalized = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  const sliced = normalized.slice(0, PREVIEW_SLUG_MAX_LENGTH);
  return sliced.replace(/^-+|-+$/g, "") || "preview";
}

function stableHash(value: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 8);
}

export function generatePreviewSlug(
  input: PreviewSlugInput,
): PreviewSlugResult {
  const base = normalizeSlugBase(input.businessName);
  const identity = [
    base,
    input.projectId,
    input.prospectId ?? "none",
  ].join("|");
  const hash = stableHash(identity);
  const version = Math.max(1, Math.floor(input.version ?? 1));
  const slug = version > 1 ? `${base}-${hash}-v${version}` : `${base}-${hash}`;
  const domain = input.domain?.trim() || DEFAULT_PREVIEW_DOMAIN;
  const hostname = `${slug}.${domain}`;

  return {
    slug,
    hostname,
    previewUrl: `https://${hostname}`,
  };
}

