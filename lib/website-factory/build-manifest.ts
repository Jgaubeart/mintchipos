import type { FrontendBuildResult } from "./types";

export type BuildManifest = {
  status: "SUCCEEDED" | "FAILED";
  workspaceId: string | null;
  filesChanged: string[];
  entryPoint: string | null;
  sourceCommit: string | null;
  buildCommand: string | null;
  buildStatus: "PASSED" | "FAILED";
  artifactVersionsUsed: Record<string, string>;
  warnings: string[];
  buildId: string | null;
};

export function frontendBuildToManifest(
  build: FrontendBuildResult,
  options: {
    workspaceId?: string | null;
    sourceCommit?: string | null;
    buildCommand?: string | null;
    artifactVersionsUsed?: Record<string, string>;
  } = {},
): BuildManifest {
  return {
    status: build.buildResult === "OK" ? "SUCCEEDED" : "FAILED",
    workspaceId: options.workspaceId ?? null,
    filesChanged: build.sourceFiles,
    entryPoint: build.sourceFiles[0] ?? null,
    sourceCommit: options.sourceCommit ?? null,
    buildCommand: options.buildCommand ?? null,
    buildStatus: build.buildResult === "OK" ? "PASSED" : "FAILED",
    artifactVersionsUsed: options.artifactVersionsUsed ?? {},
    warnings: [],
    buildId: build.buildId,
  };
}

export function validateBuildManifest(value: unknown): {
  ok: boolean;
  errors: string[];
} {
  if (!value || typeof value !== "object") {
    return { ok: false, errors: ["Build manifest must be an object."] };
  }

  const manifest = value as BuildManifest;
  const errors: string[] = [];

  if (!["SUCCEEDED", "FAILED"].includes(manifest.status)) {
    errors.push("status must be SUCCEEDED or FAILED.");
  }
  if (!["PASSED", "FAILED"].includes(manifest.buildStatus)) {
    errors.push("buildStatus must be PASSED or FAILED.");
  }
  if (!Array.isArray(manifest.filesChanged)) {
    errors.push("filesChanged must be an array.");
  }

  return { ok: errors.length === 0, errors };
}

