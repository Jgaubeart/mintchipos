import type {
  DemoDeploymentCreateResult,
  DemoDeploymentLogsResult,
  DemoDeploymentProvider,
  DemoDeploymentProviderCreateInput,
  DemoDeploymentStatusResult,
} from "./types";

type MockDeployment = {
  providerDeploymentId: string;
  previewUrl: string | null;
  status: "BUILDING" | "READY" | "FAILED";
  failureReason: string | null;
  logs: string[];
};

export class MockDemoDeploymentProvider implements DemoDeploymentProvider {
  readonly name = "MOCK";
  readonly isConfigured = true;

  private deployments = new Map<string, MockDeployment>();
  private readonly failOnCreate: boolean;

  constructor(options: { failOnCreate?: boolean } = {}) {
    this.failOnCreate = options.failOnCreate ?? false;
  }

  async createPreview(
    input: DemoDeploymentProviderCreateInput,
  ): Promise<DemoDeploymentCreateResult> {
    const providerDeploymentId = `mock_${input.previewSlug.slug}`;

    if (this.failOnCreate) {
      throw new Error("Mock deployment provider failed to create the preview.");
    }

    this.deployments.set(providerDeploymentId, {
      providerDeploymentId,
      previewUrl: input.previewSlug.previewUrl,
      status: "READY",
      failureReason: null,
      logs: [
        `Creating preview for ${input.previewSlug.slug}`,
        "Build started",
        "Build complete",
        "Preview ready",
      ],
    });

    return {
      providerDeploymentId,
      previewUrl: input.previewSlug.previewUrl,
      status: "READY",
    };
  }

  async getDeploymentStatus(
    providerDeploymentId: string,
  ): Promise<DemoDeploymentStatusResult> {
    const deployment = this.deployments.get(providerDeploymentId);
    if (!deployment) {
      throw new Error("Mock deployment not found.");
    }

    return {
      providerDeploymentId,
      status: deployment.status,
      previewUrl: deployment.previewUrl,
      failureReason: deployment.failureReason,
    };
  }

  async getDeploymentLogs(
    providerDeploymentId: string,
  ): Promise<DemoDeploymentLogsResult> {
    const deployment = this.deployments.get(providerDeploymentId);
    if (!deployment) {
      throw new Error("Mock deployment not found.");
    }

    return {
      providerDeploymentId,
      logs: deployment.logs,
    };
  }

  async archivePreview(providerDeploymentId: string): Promise<void> {
    const deployment = this.deployments.get(providerDeploymentId);
    if (!deployment) {
      throw new Error("Mock deployment not found.");
    }

    this.deployments.delete(providerDeploymentId);
  }
}

export function getDemoDeploymentProvider(): DemoDeploymentProvider {
  return new MockDemoDeploymentProvider();
}

