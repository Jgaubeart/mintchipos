import type {
  DemoDeploymentRecord,
  DeploymentLineage,
} from "./types";

export function buildDeploymentLineage(
  deployment: DemoDeploymentRecord,
): DeploymentLineage {
  return {
    projectId: deployment.projectId,
    prospectId: deployment.prospectId,
    sourceArtifactId: deployment.sourceArtifactId,
    sourceArtifactType: deployment.sourceArtifactType,
    sourceCommit: deployment.sourceCommit,
    buildId: deployment.buildId,
    provider: deployment.provider,
    providerDeploymentId: deployment.providerDeploymentId,
    previewUrl: deployment.previewUrl,
    version: deployment.version,
  };
}

export function describeDeploymentLineage(
  deployment: DemoDeploymentRecord,
): string {
  const parts = [
    deployment.projectId
      ? `project:${deployment.projectId}`
      : "project:unknown",
  ];

  if (deployment.prospectId) {
    parts.push(`prospect:${deployment.prospectId}`);
  }
  if (deployment.sourceArtifactId) {
    parts.push(`artifact:${deployment.sourceArtifactId}`);
  }
  if (deployment.sourceCommit) {
    parts.push(`commit:${deployment.sourceCommit}`);
  }
  if (deployment.buildId) {
    parts.push(`build:${deployment.buildId}`);
  }

  parts.push(`provider:${deployment.provider}`);
  parts.push(`version:${deployment.version}`);

  return parts.join(" → ");
}

