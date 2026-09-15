import {
  getArtifactVersions,
  getIndustryPlaybookArtifact,
} from "@/lib/playbooks/queries";
import type { IndustryPlaybook } from "@/lib/playbooks/types";
import type {
  PlaybookSelectionProvider,
} from "./types";

export class SupabasePlaybookProvider implements PlaybookSelectionProvider {
  constructor(private readonly projectId: string) {}

  async select(): Promise<{
    playbook: IndustryPlaybook | null;
    artifactVersionId: string | null;
  }> {
    const artifact = await getIndustryPlaybookArtifact(this.projectId);
    if (!artifact) {
      return {
        playbook: null,
        artifactVersionId: null,
      };
    }

    const versions = await getArtifactVersions(artifact.id);
    const latest = versions[0];
    if (!latest) {
      return {
        playbook: null,
        artifactVersionId: null,
      };
    }

    return {
      playbook: latest.structured_data as IndustryPlaybook | null,
      artifactVersionId: latest.id,
    };
  }
}
