import type { DuplicateKeys, NormalizedCandidate } from "./types";

function isNonEmpty(value: string | undefined): value is string {
  return Boolean(value);
}

export function isDuplicate(
  left: DuplicateKeys,
  right: DuplicateKeys,
): boolean {
  if (isNonEmpty(left.domain) && left.domain === right.domain) {
    return true;
  }

  if (isNonEmpty(left.phone) && left.phone === right.phone) {
    return true;
  }

  if (isNonEmpty(left.address) && left.address === right.address) {
    return true;
  }

  return isNonEmpty(left.name) && left.name === right.name;
}

export function dedupeCandidates(
  candidates: NormalizedCandidate[],
): NormalizedCandidate[] {
  const kept: NormalizedCandidate[] = [];
  const seen: DuplicateKeys[] = [];

  for (const candidate of candidates) {
    const duplicate = seen.some((keys) =>
      isDuplicate(keys, candidate.duplicateKeys),
    );

    if (duplicate) {
      continue;
    }

    kept.push(candidate);
    seen.push(candidate.duplicateKeys);
  }

  return kept;
}

