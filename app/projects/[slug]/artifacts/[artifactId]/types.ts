export type AddArtifactVersionFormState = {
  error: string | null;
  fieldErrors: {
    content?: string;
  };
};

export const initialAddArtifactVersionFormState: AddArtifactVersionFormState = {
  error: null,
  fieldErrors: {},
};
