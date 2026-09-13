export type CreateTestRunFormState = {
  error: string | null;
  fieldErrors: {
    project_id?: string;
    input?: string;
  };
};

export const initialCreateTestRunFormState: CreateTestRunFormState = {
  error: null,
  fieldErrors: {},
};
