-- Add DESIGN_DIRECTION_BRIEF to the artifact type domain.

alter table public.artifacts
  drop constraint if exists artifacts_artifact_type_check;

alter table public.artifacts
  add constraint artifacts_artifact_type_check
  check (
    artifact_type in (
      'BRIEF',
      'RESEARCH',
      'WEBSITE_AUDIT',
      'POSITIONING',
      'BRAND_DIRECTION',
      'UX_ARCHITECTURE',
      'COPY',
      'CREATIVE_DIRECTION',
      'INTERACTION_SPEC',
      'BUILD_PLAN',
      'VISUAL_QA',
      'FUNCTIONAL_QA',
      'LAUNCH_INFO',
      'DESIGN_DIRECTION_BRIEF'
    )
  );
