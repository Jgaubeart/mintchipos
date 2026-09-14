export type GenerateDemoFormState = {
  error: string | null;
  fieldErrors: {
    websiteUrl?: string;
    businessName?: string;
  };
};

export const initialGenerateDemoFormState: GenerateDemoFormState = {
  error: null,
  fieldErrors: {},
};

