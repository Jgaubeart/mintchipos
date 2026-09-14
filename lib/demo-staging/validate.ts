import {
  DEPLOYMENT_STATUSES,
  DEPLOYMENT_TYPES,
  PREVIEW_VISIBILITIES,
  DEMO_PROVIDER_NAMES,
} from "./constants";
import type {
  DemoDeploymentRecord,
  DeploymentStatus,
  DeploymentType,
  DeploymentValidationResult,
  PreviewVisibility,
} from "./types";

export function isDeploymentType(value: string): value is DeploymentType {
  return DEPLOYMENT_TYPES.includes(value as DeploymentType);
}

export function isDeploymentStatus(value: string): value is DeploymentStatus {
  return DEPLOYMENT_STATUSES.includes(value as DeploymentStatus);
}

export function isPreviewVisibility(
  value: string,
): value is PreviewVisibility {
  return PREVIEW_VISIBILITIES.includes(value as PreviewVisibility);
}

export function isDemoProviderName(
  value: string,
): value is (typeof DEMO_PROVIDER_NAMES)[number] {
  return DEMO_PROVIDER_NAMES.includes(
    value as (typeof DEMO_PROVIDER_NAMES)[number],
  );
}

export function validateDeploymentRecord(
  deployment: Partial<DemoDeploymentRecord>,
): DeploymentValidationResult {
  const fieldErrors: DeploymentValidationResult["fieldErrors"] = {};

  if (!deployment.projectId?.trim()) {
    fieldErrors.projectId = "Project ID is required.";
  }

  if (
    deployment.deploymentType &&
    !isDeploymentType(deployment.deploymentType)
  ) {
    fieldErrors.deploymentType = "Unknown deployment type.";
  }

  if (deployment.status && !isDeploymentStatus(deployment.status)) {
    fieldErrors.status = "Unknown deployment status.";
  }

  if (deployment.provider && !isDemoProviderName(deployment.provider)) {
    fieldErrors.provider = "Unknown deployment provider.";
  }

  if (
    deployment.previewVisibility &&
    !isPreviewVisibility(deployment.previewVisibility)
  ) {
    fieldErrors.previewVisibility = "Unknown preview visibility.";
  }

  if (
    deployment.previewUrl &&
    !/^https:\/\//i.test(deployment.previewUrl)
  ) {
    fieldErrors.previewUrl = "Preview URL must use HTTPS.";
  }

  if (
    deployment.version !== undefined &&
    (!Number.isInteger(deployment.version) || deployment.version < 1)
  ) {
    fieldErrors.version = "Version must be a whole number of 1 or more.";
  }

  return {
    ok: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  };
}

