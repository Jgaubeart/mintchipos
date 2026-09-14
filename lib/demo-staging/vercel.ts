import type {
  DemoDeploymentCreateResult,
  DemoDeploymentLogsResult,
  DemoDeploymentProvider,
  DemoDeploymentProviderCreateInput,
  DemoDeploymentStatusResult,
} from "./types";

function configuredValue(value: string | undefined): string | null {
  return value?.trim() || null;
}

async function vercelJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = configuredValue(process.env.VERCEL_TOKEN);
  if (!token) {
    throw new Error("VERCEL_TOKEN is not configured.");
  }

  const teamId = configuredValue(process.env.VERCEL_TEAM_ID);
  const url = new URL(`https://api.vercel.com${path}`);
  if (teamId) {
    url.searchParams.set("teamId", teamId);
  }

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Vercel API request failed (${response.status} ${response.statusText}).`,
    );
  }

  return (await response.json()) as T;
}

/**
 * Vercel-shaped adapter. This workstream does not perform live Vercel calls;
 * the adapter is present so a future operator can enable previews after
 * supplying VERCEL_TOKEN, VERCEL_PROJECT_ID, and optionally VERCEL_TEAM_ID.
 */
export class VercelDemoDeploymentProvider implements DemoDeploymentProvider {
  readonly name = "VERCEL";

  get isConfigured(): boolean {
    return Boolean(
      configuredValue(process.env.VERCEL_TOKEN) &&
        configuredValue(process.env.VERCEL_PROJECT_ID),
    );
  }

  async createPreview(
    input: DemoDeploymentProviderCreateInput,
  ): Promise<DemoDeploymentCreateResult> {
    const projectId = configuredValue(process.env.VERCEL_PROJECT_ID);
    if (!this.isConfigured || !projectId) {
      throw new Error(
        "VERCEL_TOKEN and VERCEL_PROJECT_ID are required for live previews.",
      );
    }

    const payload = await vercelJson<{
      id: string;
      url?: string;
      readyState?: string;
    }>("/v13/deployments", {
      method: "POST",
      body: JSON.stringify({
        name: input.previewSlug.slug,
        project: projectId,
        target: "preview",
        meta: {
          mintchip_project_id: input.projectId,
          mintchip_prospect_id: input.prospectId ?? null,
          mintchip_deployment_type: input.deploymentType,
          mintchip_preview_visibility: input.previewVisibility,
        },
      }),
    });

    return {
      providerDeploymentId: payload.id,
      previewUrl: payload.url ?? input.previewSlug.previewUrl,
      status: payload.readyState === "READY" ? "READY" : "BUILDING",
    };
  }

  async getDeploymentStatus(
    providerDeploymentId: string,
  ): Promise<DemoDeploymentStatusResult> {
    const payload = await vercelJson<{
      id: string;
      url?: string;
      readyState?: string;
      errorMessage?: string;
    }>(`/v13/deployments/${providerDeploymentId}`);

    return {
      providerDeploymentId: payload.id,
      status:
        payload.readyState === "READY"
          ? "READY"
          : payload.readyState === "ERROR"
            ? "FAILED"
            : "BUILDING",
      previewUrl: payload.url ?? null,
      failureReason: payload.errorMessage ?? null,
    };
  }

  async getDeploymentLogs(
    providerDeploymentId: string,
  ): Promise<DemoDeploymentLogsResult> {
    const payload = await vercelJson<{ events?: { text?: string }[] }>(
      `/v3/deployments/${providerDeploymentId}/events?direction=forward`,
    );

    return {
      providerDeploymentId,
      logs: (payload.events ?? [])
        .map((event) => event.text ?? "")
        .filter(Boolean),
    };
  }

  async archivePreview(providerDeploymentId: string): Promise<void> {
    await vercelJson<unknown>(`/v13/deployments/${providerDeploymentId}`, {
      method: "DELETE",
    });
  }
}

