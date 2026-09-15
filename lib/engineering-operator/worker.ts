import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { MAX_ENGINEERING_REPAIR_ATTEMPTS } from "./constants";
import type {
  EngineeringTaskEnvelope,
  EngineeringExecutionResult,
} from "./types";

export type EngineeringWorkerCommandResult = {
  code: number | null;
  stdout: string;
  stderr: string;
};

export type EngineeringWorkerWorkspace = {
  rootPath: string;
  prepare(envelope: EngineeringTaskEnvelope): Promise<void>;
  run(
    command: string,
    args: string[],
  ): Promise<EngineeringWorkerCommandResult>;
  readText(relativePath: string): Promise<string | null>;
  writeText(relativePath: string, content: string): Promise<void>;
  changedFiles(): Promise<string[]>;
  commit(files: string[], message: string): Promise<string>;
  cleanup(): Promise<void>;
};

type EngineeringMutationPlan = {
  files: string[];
  commitMessage: string;
  apply(
    workspace: EngineeringWorkerWorkspace,
  ): Promise<void>;
  repair?(
    workspace: EngineeringWorkerWorkspace,
    attempt: number,
    stdout: string,
    stderr: string,
  ): Promise<void>;
};

function compact(text: string, limit = 1200): string {
  return text.replace(/\s+/g, " ").trim().slice(0, limit);
}

function safeBranchSegment(branch: string): string {
  return branch.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);
}

export function isEngineeringMutationIntent(
  intent: EngineeringTaskEnvelope["intent"],
): boolean {
  return [
    "ENGINEERING_FIX_BUG",
    "ENGINEERING_BUILD_FEATURE",
    "ENGINEERING_CONTINUE_PROJECT",
    "ENGINEERING_DEPLOY_PREVIEW",
  ].includes(intent);
}

export function canExecuteEngineeringMutation(
  envelope: EngineeringTaskEnvelope,
): { allowed: boolean; reason: string } {
  if (!isEngineeringMutationIntent(envelope.intent)) {
    return { allowed: false, reason: "This intent is not a code mutation." };
  }

  if (envelope.approvalState !== "AUTO_APPROVED") {
    return {
      allowed: false,
      reason: "The task is not auto-approved for scoped execution.",
    };
  }

  if (envelope.riskLevel === "HIGH" || envelope.riskLevel === "CRITICAL") {
    return {
      allowed: false,
      reason: `${envelope.riskLevel} risk work requires explicit owner approval.`,
    };
  }

  const prohibited = envelope.prohibitedActions.join(" ").toLowerCase();
  const goal = envelope.goal.toLowerCase();
  if (
    prohibited.includes("arbitrary shell") ||
    goal.includes("arbitrary shell")
  ) {
    return {
      allowed: false,
      reason: "Arbitrary shell execution is not an engineering intent.",
    };
  }

  return { allowed: true, reason: "Scoped low/medium engineering work." };
}

export function shouldRetryEngineeringVerification(input: {
  attempt: number;
  maxAttempts: number;
}): boolean {
  return input.attempt < input.maxAttempts;
}

export function verificationSummaryFromCommand(
  result: EngineeringWorkerCommandResult,
): string {
  if (result.code === 0) {
    const lines = result.stdout.trim().split(/\r?\n/).slice(-8);
    return compact(lines.join(" ") || "Verification passed.");
  }

  return compact(
    (result.stderr || result.stdout || "Verification failed.").slice(-2000),
  );
}

export function resolveEngineeringWorkspacePath(
  rootPath: string,
  relativePath: string,
): string {
  const resolved = path.resolve(
    /* turbopackIgnore: true */ rootPath,
    relativePath,
  );
  if (!resolved.startsWith(rootPath)) {
    throw new Error("Engineering workspace path escaped its boundary.");
  }
  return resolved;
}

function requestIsOrchestratorCardImprovement(envelope: EngineeringTaskEnvelope): boolean {
  const goal = envelope.goal.toLowerCase();
  return (
    goal.includes("orchestrator") &&
    goal.includes("engineering") &&
    goal.includes("card") &&
    goal.includes("commit") &&
    goal.includes("verification")
  );
}

function orchestratorCardPlan(): EngineeringMutationPlan {
  const oldBlock = `                      {task.commit_sha ? (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          Commit: {task.commit_sha}
                        </p>
                      ) : null}`;
  const newBlock = `                      {task.commit_sha ? (
                        <div className="mt-2 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                          <p>
                            Commit:{" "}
                            <code className="font-mono">{task.commit_sha}</code>
                          </p>
                          <p className="mt-1">
                            Verification:{" "}
                            {task.verification_status ?? "Not recorded"}
                          </p>
                        </div>
                      ) : null}`;

  return {
    files: ["app/orchestrator/page.tsx"],
    commitMessage:
      "Clarify Orchestrator engineering commit and verification results",
    async apply(workspace) {
      const relativePath = "app/orchestrator/page.tsx";
      const existing = await workspace.readText(relativePath);
      if (!existing) {
        throw new Error(`Required file is missing: ${relativePath}`);
      }

      const normalized = existing.replace(/\r\n/g, "\n");

      if (normalized.includes(newBlock)) {
        return;
      }

      if (!normalized.includes(oldBlock)) {
        const head = await workspace.run("git", ["rev-parse", "HEAD"]);
        throw new Error(
          `The Orchestrator task card no longer contains the expected commit block; inspect the file before applying a scoped change. marker=${normalized.includes("task.commit_sha") ? "present" : "missing"} head=${head.code === 0 ? head.stdout.trim() : "unknown"}`,
        );
      }

      await workspace.writeText(
        relativePath,
        normalized.replace(oldBlock, newBlock),
      );
    },
    async repair(workspace) {
      const relativePath = "app/orchestrator/page.tsx";
      const existing = await workspace.readText(relativePath);
      const normalized = existing?.replace(/\r\n/g, "\n");
      if (
        normalized &&
        !normalized.includes(newBlock) &&
        normalized.includes(oldBlock)
      ) {
        await workspace.writeText(
          relativePath,
          normalized.replace(oldBlock, newBlock),
        );
      }
    },
  };
}

export function selectEngineeringMutationPlan(
  envelope: EngineeringTaskEnvelope,
): EngineeringMutationPlan | null {
  if (requestIsOrchestratorCardImprovement(envelope)) {
    return orchestratorCardPlan();
  }

  return null;
}

export class LocalEngineeringWorkspace
  implements EngineeringWorkerWorkspace
{
  rootPath: string;
  private readonly repositoryRoot: string;
  private readonly workspaceParent: string;

  constructor(options?: {
    repositoryRoot?: string;
    workspaceParent?: string;
  }) {
    this.repositoryRoot = path.resolve(
      /* turbopackIgnore: true */ options?.repositoryRoot ?? process.cwd(),
    );
    this.workspaceParent = path.resolve(
      /* turbopackIgnore: true */ options?.workspaceParent ??
        path.join(
          /* turbopackIgnore: true */ this.repositoryRoot,
          ".engineering-worktrees",
        ),
    );
    this.rootPath = this.repositoryRoot;
  }

  async prepare(envelope: EngineeringTaskEnvelope): Promise<void> {
    const branch = envelope.workingBranch ?? "engineering-task";
    const taskSuffix = envelope.taskId.slice(0, 8);
    const workspacePath = path.join(
      this.workspaceParent,
      `${safeBranchSegment(branch)}-${taskSuffix}`,
    );

    await mkdir(this.workspaceParent, { recursive: true });

    await runGit(this.repositoryRoot, "worktree", [
      "remove",
      "--force",
      workspacePath,
    ]);
    await rm(workspacePath, { recursive: true, force: true }).catch(
      () => undefined,
    );

    const result = await runGit(
      this.repositoryRoot,
      "worktree",
      ["add", "--detach", workspacePath, envelope.baseBranch],
    );
    if (result.code !== 0) {
      throw new Error(
        `Could not prepare isolated workspace: ${compact(result.stderr || result.stdout)}`,
      );
    }

    const branchResult = await runGit(workspacePath, "switch", ["-C", branch]);
    if (branchResult.code !== 0) {
      await runGit(this.repositoryRoot, "worktree", [
        "remove",
        "--force",
        workspacePath,
      ]);
      throw new Error(
        `Could not create focused branch ${branch}: ${compact(branchResult.stderr || branchResult.stdout)}`,
      );
    }

    this.rootPath = workspacePath;

    await copyFile(
      path.join(this.repositoryRoot, ".env.local"),
      path.join(workspacePath, ".env.local"),
    ).catch(() => undefined);

    const installResult = await runProcess("npm", ["ci"], workspacePath);
    if (installResult.code !== 0) {
      await runGit(this.repositoryRoot, "worktree", [
        "remove",
        "--force",
        workspacePath,
      ]);
      throw new Error(
        `Could not install dependencies in the isolated workspace: ${compact(installResult.stderr || installResult.stdout)}`,
      );
    }

    const typegenResult = await runProcess(
      "npx",
      ["next", "typegen"],
      workspacePath,
    );
    if (typegenResult.code !== 0) {
      throw new Error(
        `Could not generate Next.js route types in the isolated workspace: ${compact(typegenResult.stderr || typegenResult.stdout)}`,
      );
    }
  }

  async run(
    command: string,
    args: string[],
  ): Promise<EngineeringWorkerCommandResult> {
    return runProcess(command, args, this.rootPath);
  }

  async readText(relativePath: string): Promise<string | null> {
    try {
      return await readFile(this.resolve(relativePath), "utf8");
    } catch {
      return null;
    }
  }

  async writeText(relativePath: string, content: string): Promise<void> {
    await writeFile(this.resolve(relativePath), content, "utf8");
  }

  async changedFiles(): Promise<string[]> {
    const result = await runGit(this.rootPath, "status", ["--porcelain"]);
    if (result.code !== 0) {
      return [];
    }

    return result.stdout
      .split(/\r?\n/)
      .map((line) => line.slice(3).trim())
      .filter((file) => file.length > 0);
  }

  async commit(files: string[], message: string): Promise<string> {
    if (files.length === 0) {
      throw new Error("No changed files were available to commit.");
    }

    const addResult = await runGit(this.rootPath, "add", ["--", ...files]);
    if (addResult.code !== 0) {
      throw new Error(
        `Could not stage engineering changes: ${compact(addResult.stderr || addResult.stdout)}`,
      );
    }

    const commitResult = await runGit(this.rootPath, "commit", ["-m", message]);
    if (commitResult.code !== 0) {
      throw new Error(
        `Could not commit engineering changes: ${compact(commitResult.stderr || commitResult.stdout)}`,
      );
    }

    const shaResult = await runGit(this.rootPath, "rev-parse", ["HEAD"]);
    return shaResult.code === 0 ? shaResult.stdout.trim() : "";
  }

  async cleanup(): Promise<void> {
    if (this.rootPath !== this.repositoryRoot) {
      await runGit(this.repositoryRoot, "worktree", [
        "remove",
        "--force",
        this.rootPath,
      ]);
    }
  }

  private resolve(relativePath: string): string {
    return resolveEngineeringWorkspacePath(this.rootPath, relativePath);
  }
}

export class LocalEngineeringWorker {
  private readonly workspace: EngineeringWorkerWorkspace;
  private readonly allowCodeMutation: boolean;
  private readonly allowLocalCommands: boolean;
  private readonly maxRepairAttempts: number;

  constructor(options?: {
    workspace?: EngineeringWorkerWorkspace;
    allowCodeMutation?: boolean;
    allowLocalCommands?: boolean;
    maxRepairAttempts?: number;
  }) {
    this.workspace =
      options?.workspace ?? new LocalEngineeringWorkspace();
    this.allowCodeMutation =
      options?.allowCodeMutation ??
      process.env.ENGINEERING_OPERATOR_ALLOW_CODE_MUTATION === "1";
    this.allowLocalCommands =
      options?.allowLocalCommands ??
      process.env.ENGINEERING_OPERATOR_ALLOW_LOCAL_COMMANDS === "1";
    this.maxRepairAttempts =
      options?.maxRepairAttempts ?? MAX_ENGINEERING_REPAIR_ATTEMPTS;
  }

  async executeTask(
    envelope: EngineeringTaskEnvelope,
  ): Promise<EngineeringExecutionResult> {
    switch (envelope.intent) {
      case "ENGINEERING_SHOW_STATUS":
        return this.showStatus();
      case "ENGINEERING_INSPECT_FAILURE":
        return this.inspectFailure();
      case "ENGINEERING_RUN_TESTS":
        return this.runVerification();
      default:
        return this.executeMutation(envelope);
    }
  }

  private async showStatus(): Promise<EngineeringExecutionResult> {
    const [currentWork, knownIssues, operatorStatus] = await Promise.all([
      this.workspace.readText("docs/current-work.md"),
      this.workspace.readText("docs/known-issues.md"),
      this.workspace.readText("docs/engineering-operator-status.md"),
    ]);

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
          metadata: {
            excerpt: compact(
              [
                currentWork ?? "No current work document found.",
                knownIssues ?? "No known-issues document found.",
                operatorStatus ?? "No operator status document found.",
              ].join(" "),
            ),
          },
        },
      ],
    };
  }

  private async inspectFailure(): Promise<EngineeringExecutionResult> {
    const knownIssues = await this.workspace.readText("docs/known-issues.md");
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

  private async runVerification(): Promise<EngineeringExecutionResult> {
    if (!this.allowLocalCommands) {
      return this.blocked(
        "Local command execution is disabled. Set ENGINEERING_OPERATOR_ALLOW_LOCAL_COMMANDS=1 or use a configured engineering runtime.",
      );
    }

    const result = await this.workspace.run("npm", ["run", "verify"]);
    const testsSummary = verificationSummaryFromCommand(result);
    if (result.code === 0) {
      return {
        status: "SUCCEEDED",
        workingBranch: null,
        commitSha: null,
        testsSummary,
        previewUrl: null,
        blocker: null,
        events: [
          { type: "TESTS_STARTED", summary: "Started npm run verify." },
          { type: "TESTS_PASSED", summary: "Verification suite passed." },
          {
            type: "COMPLETED",
            summary: "Deterministic verification completed.",
          },
        ],
      };
    }

    return {
      status: "FAILED",
      workingBranch: null,
      commitSha: null,
      testsSummary,
      previewUrl: null,
      blocker: testsSummary,
      events: [
        { type: "TESTS_STARTED", summary: "Started npm run verify." },
        { type: "TESTS_FAILED", summary: "Verification suite failed." },
      ],
    };
  }

  private async executeMutation(
    envelope: EngineeringTaskEnvelope,
  ): Promise<EngineeringExecutionResult> {
    const gate = canExecuteEngineeringMutation(envelope);
    if (!gate.allowed) {
      return this.blocked(gate.reason);
    }

    if (!this.allowCodeMutation) {
      return this.blocked(
        "Code-mutating engineering work is disabled. Set ENGINEERING_OPERATOR_ALLOW_CODE_MUTATION=1 in a controlled worker environment.",
      );
    }

    const plan = selectEngineeringMutationPlan(envelope);
    if (!plan) {
      return this.blocked(
        "No deterministic, safe code-mutation plan is available for this task. A human or authorized Hermes step is required to select the scoped change.",
      );
    }

    try {
      await this.workspace.prepare(envelope);
      await plan.apply(this.workspace);

      const verification = await this.runVerificationWithRepair(
        plan,
        this.workspace,
      );
      if (!verification.passed) {
        await this.workspace.cleanup();
        return {
          status: "FAILED",
          workingBranch: envelope.workingBranch,
          commitSha: null,
          testsSummary: verification.summary,
          previewUrl: null,
          blocker: verification.summary,
          events: [
            { type: "TESTS_STARTED", summary: "Started npm run verify." },
            {
              type: "TESTS_FAILED",
              summary: "Verification failed after bounded repair attempts.",
              metadata: { attempts: verification.attempt },
            },
          ],
        };
      }

      const files = await this.workspace.changedFiles();
      const commitSha = await this.workspace.commit(
        files,
        plan.commitMessage,
      );
      const previewUrl = await this.tryDeployPreview();

      return {
        status: "SUCCEEDED",
        workingBranch: envelope.workingBranch,
        commitSha,
        testsSummary: verification.summary,
        previewUrl,
        blocker: null,
        events: [
          { type: "BRANCH_CREATED", summary: "Created focused feature branch." },
          {
            type: "FILES_CHANGED",
            summary: `Changed ${files.length} file${files.length === 1 ? "" : "s"}.`,
            metadata: { files },
          },
          { type: "TESTS_STARTED", summary: "Started npm run verify." },
          {
            type: "TESTS_PASSED",
            summary: "Verification suite passed.",
            metadata: { attempts: verification.attempt },
          },
          ...(previewUrl
            ? [
                {
                  type: "PREVIEW_DEPLOYED" as const,
                  summary: "Non-production preview deployed.",
                  metadata: { previewUrl },
                },
              ]
            : []),
          { type: "COMPLETED", summary: "Scoped engineering task completed." },
        ],
      };
    } catch (error) {
      await this.workspace.cleanup();
      const message =
        error instanceof Error ? error.message : "Engineering worker failed.";
      return {
        status: "FAILED",
        workingBranch: envelope.workingBranch,
        commitSha: null,
        testsSummary: null,
        previewUrl: null,
        blocker: message,
        events: [
          {
            type: "BLOCKED",
            summary: message,
          },
        ],
      };
    }
  }

  private async runVerificationWithRepair(
    plan: EngineeringMutationPlan,
    workspace: EngineeringWorkerWorkspace,
  ): Promise<{
    passed: boolean;
    summary: string;
    attempt: number;
  }> {
    let result = await workspace.run("npm", ["run", "verify"]);
    let attempt = 1;

    while (
      result.code !== 0 &&
      shouldRetryEngineeringVerification({
        attempt,
        maxAttempts: this.maxRepairAttempts,
      }) &&
      plan.repair
    ) {
      await plan.repair(
        workspace,
        attempt,
        result.stdout,
        result.stderr,
      );
      attempt += 1;
      result = await workspace.run("npm", ["run", "verify"]);
    }

    return {
      passed: result.code === 0,
      summary: verificationSummaryFromCommand(result),
      attempt,
    };
  }

  private async tryDeployPreview(): Promise<string | null> {
    // Preview deployment is optional. Keep it non-blocking and do not invent
    // production or DNS changes here. A configured provider can extend this
    // worker later.
    return null;
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

async function runProcess(
  command: string,
  args: string[],
  cwd: string,
): Promise<EngineeringWorkerCommandResult> {
  return new Promise((resolve) => {
    const useShell = process.platform === "win32" && command !== "git";
    const childEnv =
      command === "npm" &&
      args[0] === "run" &&
      args[1] === "verify"
        ? {
            ...process.env,
            NODE_ENV: "production",
          }
        : process.env;
    let child;
    try {
      child = spawn(command, args, {
        cwd,
        shell: useShell,
        windowsHide: true,
        env: childEnv,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      resolve({
        code: null,
        stdout: "",
        stderr: `spawn ${command} failed: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      });
      return;
    }

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
      resolve({
        code: null,
        stdout,
        stderr: "Command could not be started.",
      });
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({ code, stdout, stderr });
    });
  });
}

async function runGit(
  cwd: string,
  command: string,
  args: string[],
): Promise<EngineeringWorkerCommandResult> {
  return runProcess("git", [command, ...args], cwd);
}

export const defaultEngineeringWorker = new LocalEngineeringWorker();
