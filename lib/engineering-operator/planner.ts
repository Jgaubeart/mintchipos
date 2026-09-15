import type { ContinuationContext, ContinuationPlan } from "./types";

function cleanSection(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function knownIssueTitles(knownIssues: string): string[] {
  const titles = knownIssues.match(/^##\s+.+$/gm) ?? [];
  return titles
    .map((title) => title.replace(/^##\s+/, "").trim())
    .filter(Boolean);
}

function firstNonBlockedKnownIssue(
  context: ContinuationContext,
): string | null {
  const issues = knownIssueTitles(context.knownIssues);
  if (issues.length === 0) {
    return null;
  }

  const normalizedIssues = issues.map((issue) => issue.toLowerCase());
  const normalizedOpenTitles = context.openTasks.map((task) =>
    task.title.toLowerCase(),
  );

  return (
    issues.find(
      (_, index) =>
        !normalizedOpenTitles.includes(normalizedIssues[index]),
    ) ?? null
  );
}

function parseBlockedSections(websiteFactoryStatus: string): string[] {
  const rows = websiteFactoryStatus.match(/^\|.*\|$/gm) ?? [];
  return rows
    .filter((row) => /\bBLOCKED\b/i.test(row))
    .map((row) => {
      const cells = row
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean);
      return cells[0] ?? null;
    })
    .filter((cell): cell is string => Boolean(cell));
}

export function buildContinuationPlan(
  context: ContinuationContext,
): ContinuationPlan {
  const currentWork = cleanSection(context.currentWork);
  const websiteBlocked = parseBlockedSections(context.websiteFactoryStatus);
  const knownIssue = firstNonBlockedKnownIssue(context);
  const openNonBlocked = context.openTasks
    .filter(
      (task) =>
        !["BLOCKED", "WAITING_FOR_APPROVAL", "SUCCEEDED", "CANCELLED"].includes(
          task.status,
        ),
    )
    .sort((a, b) => a.title.localeCompare(b.title));

  if (openNonBlocked.length > 0) {
    const task = openNonBlocked[0];
    return {
      selectedTaskId: task.id,
      selectedTitle: task.title,
      reason:
        "An open, non-blocked engineering task already exists and should be continued first.",
      decisionRequest: null,
    };
  }

  if (currentWork && /active work order/i.test(currentWork)) {
    const objective = currentWork.match(/###\s*Objective\s*\n+([^\n]+)/i)?.[1];
    if (objective) {
      return {
        selectedTaskId: null,
        selectedTitle: objective.trim(),
        reason:
          "The active work order in docs/current-work.md is the canonical next engineering objective.",
        decisionRequest: null,
      };
    }
  }

  if (knownIssue) {
    return {
      selectedTaskId: null,
      selectedTitle: knownIssue,
      reason:
        "A documented known issue has no matching open engineering task, so it is the highest-priority non-blocked fix.",
      decisionRequest: null,
    };
  }

  if (websiteBlocked.length > 0) {
    return {
      selectedTaskId: null,
      selectedTitle: websiteBlocked[0],
      reason:
        "The Website Factory status document identifies blocked components that need attention.",
      decisionRequest:
        "The next factory item is currently marked BLOCKED and may require external credentials or a product decision before engineering can proceed.",
    };
  }

  return {
    selectedTaskId: null,
    selectedTitle: null,
    reason:
      "No non-blocked engineering work or documented issue was found in canonical state.",
    decisionRequest:
      "Select the next product milestone or provide a specific engineering goal.",
  };
}
