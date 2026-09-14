import type {
  DemoProviderName,
  DeploymentStatus,
  DeploymentType,
  PreviewVisibility,
} from "./constants";

export type JsonObject = Record<string, unknown>;

export type DemoDeploymentRecord = {
  id: string;
  projectId: string;
  prospectId: string | null;
  deploymentType: DeploymentType;
  status: DeploymentStatus;
  provider: DemoProviderName;
  providerDeploymentId: string | null;
  previewUrl: string | null;
  previewHostname: string | null;
  previewVisibility: PreviewVisibility;
  sourceArtifactId: string | null;
  sourceArtifactType: string | null;
  sourceCommit: string | null;
  buildId: string | null;
  version: number;
  metadata: JsonObject;
  isCurrent: boolean;
  failureReason: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deployedAt: string | null;
  failedAt: string | null;
  supersededAt: string | null;
};

export type CreateDemoDeploymentInput = {
  projectId: string;
  prospectId?: string | null;
  deploymentType?: DeploymentType;
  provider?: DemoProviderName;
  previewVisibility?: PreviewVisibility;
  sourceArtifactId?: string | null;
  sourceArtifactType?: string | null;
  sourceCommit?: string | null;
  buildId?: string | null;
  version?: number;
  metadata?: JsonObject;
  createdBy?: string | null;
};

export type PreviewSlugInput = {
  businessName: string;
  projectId: string;
  prospectId?: string | null;
  version?: number;
  domain?: string;
};

export type PreviewSlugResult = {
  slug: string;
  hostname: string;
  previewUrl: string;
};

export type DemoDeploymentProviderCreateInput = {
  projectId: string;
  prospectId: string | null;
  deploymentType: DeploymentType;
  previewSlug: PreviewSlugResult;
  previewVisibility: PreviewVisibility;
  sourceCommit: string | null;
  buildId: string | null;
  metadata: JsonObject;
};

export type DemoDeploymentCreateResult = {
  providerDeploymentId: string;
  previewUrl: string | null;
  status: DeploymentStatus;
};

export type DemoDeploymentStatusResult = {
  providerDeploymentId: string;
  status: DeploymentStatus;
  previewUrl: string | null;
  failureReason: string | null;
};

export type DemoDeploymentLogsResult = {
  providerDeploymentId: string;
  logs: string[];
};

export type DemoDeploymentProvider = {
  name: string;
  isConfigured: boolean;
  createPreview(
    input: DemoDeploymentProviderCreateInput,
  ): Promise<DemoDeploymentCreateResult>;
  getDeploymentStatus(
    providerDeploymentId: string,
  ): Promise<DemoDeploymentStatusResult>;
  getDeploymentLogs(
    providerDeploymentId: string,
  ): Promise<DemoDeploymentLogsResult>;
  archivePreview(providerDeploymentId: string): Promise<void>;
};

export type DeploymentLineage = {
  projectId: string;
  prospectId: string | null;
  sourceArtifactId: string | null;
  sourceArtifactType: string | null;
  sourceCommit: string | null;
  buildId: string | null;
  provider: DemoProviderName;
  providerDeploymentId: string | null;
  previewUrl: string | null;
  version: number;
};

export type DeploymentValidationResult = {
  ok: boolean;
  fieldErrors: Partial<
    Record<
      | "projectId"
      | "deploymentType"
      | "status"
      | "provider"
      | "previewUrl"
      | "previewVisibility"
      | "version",
      string
    >
  >;
};

export type {
  DemoProviderName,
  DeploymentStatus,
  DeploymentType,
  PreviewVisibility,
} from "./constants";
