import {
  DISCOVERY_SOURCE_LABELS,
  PROSPECT_STATUS_LABELS,
  SCAN_STATUS_LABELS,
  type DiscoverySource,
  type ProspectStatus,
  type ScanStatus,
} from "./constants";

export function formatProspectStatus(status: string): string {
  return (
    PROSPECT_STATUS_LABELS[status as ProspectStatus] ??
    status.replace(/_/g, " ")
  );
}

export function formatScanStatus(status: string): string {
  return SCAN_STATUS_LABELS[status as ScanStatus] ?? status.replace(/_/g, " ");
}

export function formatDiscoverySource(source: string): string {
  return (
    DISCOVERY_SOURCE_LABELS[source as DiscoverySource] ??
    source.replace(/_/g, " ")
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

