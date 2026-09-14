import {
  DEPLOYMENT_STATUS_LABELS,
  DEPLOYMENT_TYPE_LABELS,
  PREVIEW_VISIBILITY_LABELS,
  type DeploymentStatus,
  type DeploymentType,
  type PreviewVisibility,
} from "./constants";

export function formatDeploymentType(value: string): string {
  return (
    DEPLOYMENT_TYPE_LABELS[value as DeploymentType] ??
    value.replace(/_/g, " ")
  );
}

export function formatDeploymentStatus(value: string): string {
  return (
    DEPLOYMENT_STATUS_LABELS[value as DeploymentStatus] ??
    value.replace(/_/g, " ")
  );
}

export function formatPreviewVisibility(value: string): string {
  return (
    PREVIEW_VISIBILITY_LABELS[value as PreviewVisibility] ??
    value.replace(/_/g, " ")
  );
}

export function formatField(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

