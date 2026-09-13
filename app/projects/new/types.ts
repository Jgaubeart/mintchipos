import type { ProjectType } from "@/lib/projects/constants";

export type CreateProjectFormState = {
  error: string | null;
  fieldErrors: {
    name?: string;
    project_type?: string;
    description?: string;
  };
};

export const initialCreateProjectFormState: CreateProjectFormState = {
  error: null,
  fieldErrors: {},
};

export type CreateProjectInput = {
  name: string;
  projectType: ProjectType;
  description: string | null;
};
