export type HermesRunResponse = {
  run_id?: string;
  id?: string;
  status?: string;
  output?: unknown;
  result?: unknown;
  model_provider?: string;
  model_name?: string;
  model?: {
    provider?: string;
    name?: string;
  };
  input_tokens?: number;
  output_tokens?: number;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  estimated_cost_usd?: number;
};

export class HermesClient {
  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
  ) {}

  async createRun(
    payload: unknown,
    idempotencyKey: string,
  ): Promise<HermesRunResponse> {
    const url = `${this.apiUrl.replace(/\/$/, "")}/v1/runs`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      const suffix = body ? `: ${body.slice(0, 300)}` : "";
      throw new Error(`Hermes request failed with status ${response.status}${suffix}`);
    }

    const data = await response.json().catch(() => null);

    if (!data || typeof data !== "object") {
      throw new Error("Hermes returned an invalid response.");
    }

    return data as HermesRunResponse;
  }
}
