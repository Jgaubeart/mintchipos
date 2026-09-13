export function extractUserMessage(snapshot: unknown): string {
  if (typeof snapshot === "string") {
    const value = snapshot.trim();
    if (!value) {
      throw new Error("No user message found in input snapshot.");
    }

    return value;
  }

  if (isRecord(snapshot)) {
    const candidates = [snapshot.user_message, snapshot.message, snapshot.input];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
  }

  throw new Error("No user message found in input snapshot.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
