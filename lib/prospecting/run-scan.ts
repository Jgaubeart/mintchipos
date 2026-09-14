import { executeProspectScan } from "./orchestrator";
import { getDiscoveryProvider } from "./providers";
import {
  createProspectScan,
  getProspectScanById,
  markProspectScanFailed,
  markProspectScanRunning,
  persistProspectScanResult,
  scanRowToInput,
} from "./queries";

export type CreateProspectScanInput = {
  location: string;
  radiusKm: number | null;
  industries: string[];
  categories: string[];
  maxProspects: number;
  exclusions: string[];
  sourceConfig: Record<string, unknown>;
};

export async function createAndRunScan(
  input: CreateProspectScanInput,
  userId: string,
): Promise<string> {
  const scan = await createProspectScan({
    ...input,
    userId,
  });

  await runScanById(scan.id);
  return scan.id;
}

export async function runScanById(scanId: string): Promise<void> {
  const scan = await getProspectScanById(scanId);
  if (!scan) {
    throw new Error("Prospect scan not found.");
  }

  await markProspectScanRunning(scanId);

  try {
    const scanInput = scanRowToInput(scan);
    const result = await executeProspectScan(
      {
        location: scanInput.location,
        industries: scanInput.industries,
        limit: scanInput.maxProspects,
        radiusKm: scanInput.radiusKm,
        exclusions: scanInput.exclusions,
        sourceConfig: scanInput.sourceConfig,
      },
      {
        discoveryProvider: getDiscoveryProvider(),
      },
    );

    await persistProspectScanResult(scanId, result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Prospect scan failed.";
    await markProspectScanFailed(scanId, message);
    throw error;
  }
}

