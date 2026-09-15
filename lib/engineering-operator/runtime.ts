import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import type { EngineeringTaskEnvelope, EngineeringExecutionResult } from "./types";

function repoPath(filePath: string): string {
  return path.join(/* turbopackIgnore: true */ process.cwd(), filePath);
}

async function readText(relativePath: string): Promise<string | null> {
  try {
    return await readFile(repoPath(relativePath), "utf8");
  } catch {
    return null;
  }
}

function compact(text: string, limit = 1200): string {
  return text.replace(/\s+/g, " ").trim().slice(0, limit);
}

function runApprovedCommand(
  command: string,
  args: string[],
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    const timeout = setTimeout(() => {
      child.kill();
    }, 1000 * 60 * 3);

    child.on("error", () => {
      clearTimeout(timeout);
      resolve({ code: null, stdout, stderr: "Command could not be started." });
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({ code, stdout, stderr });
    });
  });
}

export class LocalRepositoryRuntime {
  private allowLocalCommands: boolean;

  constructor(options?: { allowLocalCommands?: boolean }) {
    this.allowLocalCommands =
      options?.allowLocalCommands ??
      process.env.ENGINEERING_OPERATOR_ALLOW_LOCAL_COMMANDS === "1";
  }

  async executeTask(
    envelope: EngineeringTaskEnvelope,
  ): Promise<EngineeringExecutionResult> {
    switch (envelope.intent) {
      case "ENGINEERING_SHOW_STATUS": {
        const [currentWork, knownIssues, operatorStatus] = await Promise.all([
          readText("docs/current-work.md"),
          readText("docs/known-issues.md"),
          readText("docs/engineering-operator-status.md"),
        ]);

        const summary = [
          currentWork ? compact(currentWork) : "No current work document found.",
          knownIssues ? compact(knownIssues) : "No known-issues document found.",
          operatorStatus
            ? compact(operatorStatus)
            : "No engineering-operator status document found.",
        ].join(" ");

        return {
          status: "SUCCEEDED",
          workingBranch: null,
          commitSha: null,
          testsSummary: null,
          previewUrl: null,
          blocker: null,
          events: [
            {
              type: "COMPLETED",
              summary: "Inspected canonical engineering status documents.",
              metadata: { source: "docs", excerpt: summary },
            },
          ],
        };
      }

      case "ENGINEERING_INSPECT_FAILURE": {
        const knownIssues = await readText("docs/known-issues.md");
        return {
          status: "SUCCEEDED",
          workingBranch: null,
          commitSha: null,
          testsSummary: null,
          previewUrl: null,
          blocker: null,
          events: [
            {
              type: "COMPLETED",
              summary: "Inspected known issues and proven fixes.",
              metadata: {
                excerpt: knownIssues ? compact(knownIssues) : null,
              },
            },
          ],
        };
      }

      case "ENGINEERING_RUN_TESTS": {
        if (!this.allowLocalCommands) {
          return this.blocked(
            "Local command execution is disabled. Set ENGINEERING_OPERATOR_ALLOW_LOCAL_COMMANDS=1 or use a configured engineering runtime.",
          );
        }

        const result = await runApprovedCommand("npm", ["run", "verify"]);
        if (result.code === 0) {
          const lastLines = result.stdout.trim().split(/\r?\n/).slice(-8).join(" ");
          return {
            status: "SUCCEEDED",
            workingBranch: null,
            commitSha: null,
            testsSummary: compact(lastLines || "npm run verify passed."),
            previewUrl: null,
            blocker: null,
            events: [
              { type: "TESTS_STARTED", summary: "Started npm run verify." },
              { type: "TESTS_PASSED", summary: "Verification suite passed." },
              { type: "COMPLETED", summary: "Deterministic verification completed." },
            ],
          };
        }

        return {
          status: "FAILED",
          workingBranch: null,
          commitSha: null,
          testsSummary: compact(result.stderr || result.stdout || "Verification failed."),
          previewUrl: null,
          blocker: result.stderr || result.stdout || "Verification failed.",
          events: [
            { type: "TESTS_STARTED", summary: "Started npm run verify." },
            { type: "TESTS_FAILED", summary: "Verification suite failed." },
          ],
        };
      }

      default:
        return this.blocked(
          "Code-mutating engineering work requires a configured ENGINEERING_OPERATOR runtime. The task is safely queued and has not been modified.",
        );
    }
  }

  private blocked(blocker: string): EngineeringExecutionResult {
    return {
      status: "BLOCKED",
      workingBranch: null,
      commitSha: null,
      testsSummary: null,
      previewUrl: null,
      blocker,
      events: [
        {
          type: "BLOCKED",
          summary: blocker,
        },
      ],
    };
  }
}

export { defaultEngineeringWorker as defaultEngineeringRuntime } from "./worker";
