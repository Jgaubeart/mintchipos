export const DEPLOYMENT_TYPES = ["PREVIEW", "PRODUCTION"] as const;

export type DeploymentType = (typeof DEPLOYMENT_TYPES)[number];

export const DEPLOYMENT_STATUSES = [
  "PENDING",
  "BUILDING",
  "READY",
  "FAILED",
  "ARCHIVED",
] as const;

export type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[number];

export const PREVIEW_VISIBILITIES = [
  "PUBLIC_DEMO",
  "UNLISTED",
  "PASSWORD_PROTECTED",
] as const;

export type PreviewVisibility = (typeof PREVIEW_VISIBILITIES)[number];

export const DEPLOYMENT_TYPE_LABELS: Record<DeploymentType, string> = {
  PREVIEW: "Preview",
  PRODUCTION: "Production",
};

export const DEPLOYMENT_STATUS_LABELS: Record<DeploymentStatus, string> = {
  PENDING: "Pending",
  BUILDING: "Building",
  READY: "Ready",
  FAILED: "Failed",
  ARCHIVED: "Archived",
};

export const PREVIEW_VISIBILITY_LABELS: Record<PreviewVisibility, string> = {
  PUBLIC_DEMO: "Public demo",
  UNLISTED: "Unlisted",
  PASSWORD_PROTECTED: "Password protected",
};

export const DEFAULT_PREVIEW_VISIBILITY: PreviewVisibility = "UNLISTED";

export const DEFAULT_PREVIEW_DOMAIN = "preview.mintchipweb.com";

export const PREVIEW_SLUG_MAX_LENGTH = 40;

export const ALLOWED_DEPLOYMENT_TRANSITIONS: Record<
  DeploymentStatus,
  DeploymentStatus[]
> = {
  PENDING: ["BUILDING", "FAILED", "ARCHIVED"],
  BUILDING: ["READY", "FAILED", "ARCHIVED"],
  READY: ["ARCHIVED"],
  FAILED: ["PENDING", "ARCHIVED"],
  ARCHIVED: [],
};

export const DEMO_PROVIDER_NAMES = ["MOCK", "VERCEL"] as const;

export type DemoProviderName = (typeof DEMO_PROVIDER_NAMES)[number];

