import { ALLOWED_DEPLOYMENT_TRANSITIONS } from "./constants";
import type {
  DemoDeploymentRecord,
  DeploymentStatus,
} from "./types";

export function canTransition(
  from: DeploymentStatus,
  to: DeploymentStatus,
): boolean {
  return ALLOWED_DEPLOYMENT_TRANSITIONS[from].includes(to);
}

export function transitionDeployment(
  deployment: DemoDeploymentRecord,
  to: DeploymentStatus,
  options: { failureReason?: string | null; now?: string } = {},
): DemoDeploymentRecord {
  if (!canTransition(deployment.status, to)) {
    throw new Error(
      `Invalid deployment transition: ${deployment.status} -> ${to}.`,
    );
  }

  const now = options.now ?? new Date().toISOString();
  const next: DemoDeploymentRecord = {
    ...deployment,
    status: to,
    updatedAt: now,
  };

  if (to === "READY") {
    next.deployedAt = now;
    next.failedAt = null;
    next.failureReason = null;
    next.isCurrent = true;
  }

  if (to === "FAILED") {
    next.failedAt = now;
    next.failureReason = options.failureReason ?? "Deployment failed.";
  }

  if (to === "ARCHIVED") {
    next.isCurrent = false;
  }

  return next;
}

export function supersedeDeployment(
  deployment: DemoDeploymentRecord,
  now = new Date().toISOString(),
): DemoDeploymentRecord {
  return {
    ...deployment,
    isCurrent: false,
    supersededAt: now,
    updatedAt: now,
  };
}

