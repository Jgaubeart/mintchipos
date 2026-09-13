export type LoginFormState = {
  error: string | null;
  fieldErrors: {
    email?: string;
    password?: string;
  };
};

export const initialLoginFormState: LoginFormState = {
  error: null,
  fieldErrors: {},
};
