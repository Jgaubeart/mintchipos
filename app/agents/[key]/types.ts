export type CreateTestRunFormState = {
  error: string | null;
  fieldErrors: {
    project_id?: string;
  };
};

export const initialCreateTestRunFormState: CreateTestRunFormState = {
  error: null,
  fieldErrors: {},
};
