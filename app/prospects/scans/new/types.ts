export type CreateProspectScanFormState = {
  error: string | null;
  fieldErrors: {
    location?: string;
    industries?: string;
    maxProspects?: string;
    radiusKm?: string;
  };
};

export const initialCreateProspectScanFormState: CreateProspectScanFormState = {
  error: null,
  fieldErrors: {},
};

