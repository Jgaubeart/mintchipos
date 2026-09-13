import type { ArtifactType } from "@/lib/artifacts/constants";

export type CreateArtifactFormState = {
  error: string | null;
  fieldErrors: {
    artifact_type?: string;
    title?: string;
    content?: string;
  };
};

export const initialCreateArtifactFormState: CreateArtifactFormState = {
  error: null,
  fieldErrors: {},
};

export type CreateArtifactInput = {
  projectId: string;
  projectSlug: string;
  artifactType: ArtifactType;
  title: string;
  content: string;
};
