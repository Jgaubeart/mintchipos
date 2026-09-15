-- Add real Website Factory agent versions for the critical Hermes-backed
-- stages. These replace the seeded placeholder instructions without creating
-- duplicate agent definitions.

do $$
declare
  v_definition_id uuid;
  v_version_id uuid;
begin
  -- ORCHESTRATOR: automatic Design Direction Brief generation.
  select id into v_definition_id
    from public.agent_definitions
   where key = 'ORCHESTRATOR';

  if v_definition_id is null then
    raise exception 'ORCHESTRATOR definition not found';
  end if;

  insert into public.agent_definition_versions (
    agent_definition_id,
    version,
    instructions,
    output_schema
  )
  select
    v_definition_id,
    2,
    $instr$You are the MintChipOS Orchestrator. Generate a Design Direction Brief from the provided business research, industry playbook, and existing project brief when available.

Decision precedence:
1. System / Mint Chip business rules
2. Project Design Direction Brief
3. Industry Playbook
4. Agent creative judgment

Preserve strong existing branding. Default to ONE_PAGE unless evidence strongly supports FIVE_PAGE. Do not invent testimonials, completed projects, awards, employees, or factual claims.

Return only valid JSON with these top-level fields:
- brief: a complete Design Direction Brief object using the existing MintChipOS brief structure
- precedence: an array of four precedence strings
- lineage: an object with boolean fields businessResearch, industryPlaybook, and systemRules.$instr$,
    $schema${
      "type": "object",
      "required": ["brief", "precedence", "lineage"],
      "properties": {
        "brief": { "type": "object" },
        "precedence": { "type": "array", "items": { "type": "string" } },
        "lineage": {
          "type": "object",
          "required": ["businessResearch", "industryPlaybook", "systemRules"],
          "properties": {
            "businessResearch": { "type": "boolean" },
            "industryPlaybook": { "type": "boolean" },
            "systemRules": { "type": "boolean" }
          }
        }
      }
    }$schema$::jsonb
  where not exists (
    select 1
    from public.agent_definition_versions
    where agent_definition_id = v_definition_id
      and version = 2
  )
  returning id into v_version_id;

  if v_version_id is not null then
    update public.agent_definitions
       set current_version_id = v_version_id,
           updated_at = now()
     where id = v_definition_id;
  end if;

  -- UX / Content Strategist.
  select id into v_definition_id
    from public.agent_definitions
   where key = 'UX_CONTENT_STRATEGIST';

  if v_definition_id is null then
    raise exception 'UX_CONTENT_STRATEGIST definition not found';
  end if;

  insert into public.agent_definition_versions (
    agent_definition_id,
    version,
    instructions,
    output_schema
  )
  select
    v_definition_id,
    2,
    $instr$You are the MintChipOS UX / Content Strategist. Use business research, the industry playbook, and the Design Direction Brief to produce a concise, mobile-first local-business UX/content strategy.

Prefer direct, short copy. Do not create unnecessary pages or bloated text.

Return only valid JSON with these top-level fields:
storytellingFlow, sectionSequence, sectionPurpose, messagingHierarchy, headlineStrategy, contentOutline, ctaPlacement, trustPlacement, mobileFlow, draftCopyDirection, contentGaps.$instr$,
    $schema${
      "type": "object",
      "required": ["storytellingFlow", "sectionSequence", "sectionPurpose", "messagingHierarchy", "headlineStrategy", "contentOutline", "ctaPlacement", "trustPlacement", "mobileFlow", "draftCopyDirection", "contentGaps"],
      "properties": {
        "storytellingFlow": { "type": "string" },
        "sectionSequence": { "type": "array", "items": { "type": "string" } },
        "sectionPurpose": { "type": "object" },
        "messagingHierarchy": { "type": "array", "items": { "type": "string" } },
        "headlineStrategy": { "type": "string" },
        "contentOutline": { "type": "array", "items": { "type": "string" } },
        "ctaPlacement": { "type": "array", "items": { "type": "string" } },
        "trustPlacement": { "type": "array", "items": { "type": "string" } },
        "mobileFlow": { "type": "string" },
        "draftCopyDirection": { "type": "string" },
        "contentGaps": { "type": "array", "items": { "type": "string" } }
      }
    }$schema$::jsonb
  where not exists (
    select 1
    from public.agent_definition_versions
    where agent_definition_id = v_definition_id
      and version = 2
  )
  returning id into v_version_id;

  if v_version_id is not null then
    update public.agent_definitions
       set current_version_id = v_version_id,
           updated_at = now()
     where id = v_definition_id;
  end if;

  -- Creative Director.
  select id into v_definition_id
    from public.agent_definitions
   where key = 'CREATIVE_DIRECTOR';

  if v_definition_id is null then
    raise exception 'CREATIVE_DIRECTOR definition not found';
  end if;

  insert into public.agent_definition_versions (
    agent_definition_id,
    version,
    instructions,
    output_schema
  )
  select
    v_definition_id,
    2,
    $instr$You are the MintChipOS Creative Director. Create an intentional, non-templated visual direction for a small local business website.

Avoid generic SaaS layouts, endless card grids, meaningless gradients, and dashboard visuals.

Return only valid JSON with these top-level fields:
centralVisualConcept, narrativeConcept, sectionComposition, sectionOrder, hierarchy, typographySystem, colorApplication, imageryStrategy, graphicMotifs, backgroundTreatment, shapeLanguage, motionDirection, mobileComposition, ctaPresentation, customAssetsNeeded, antiPatterns.$instr$,
    $schema${
      "type": "object",
      "required": ["centralVisualConcept", "narrativeConcept", "sectionComposition", "sectionOrder", "hierarchy", "typographySystem", "colorApplication", "imageryStrategy", "graphicMotifs", "backgroundTreatment", "shapeLanguage", "motionDirection", "mobileComposition", "ctaPresentation", "customAssetsNeeded", "antiPatterns"],
      "properties": {
        "centralVisualConcept": { "type": "string" },
        "narrativeConcept": { "type": "string" },
        "sectionComposition": { "type": "array", "items": { "type": "string" } },
        "sectionOrder": { "type": "array", "items": { "type": "string" } },
        "hierarchy": { "type": "array", "items": { "type": "string" } },
        "typographySystem": { "type": "string" },
        "colorApplication": { "type": "string" },
        "imageryStrategy": { "type": "string" },
        "graphicMotifs": { "type": "array", "items": { "type": "string" } },
        "backgroundTreatment": { "type": "string" },
        "shapeLanguage": { "type": "string" },
        "motionDirection": { "type": "string" },
        "mobileComposition": { "type": "string" },
        "ctaPresentation": { "type": "string" },
        "customAssetsNeeded": { "type": "array", "items": { "type": "string" } },
        "antiPatterns": { "type": "array", "items": { "type": "string" } }
      }
    }$schema$::jsonb
  where not exists (
    select 1
    from public.agent_definition_versions
    where agent_definition_id = v_definition_id
      and version = 2
  )
  returning id into v_version_id;

  if v_version_id is not null then
    update public.agent_definitions
       set current_version_id = v_version_id,
           updated_at = now()
     where id = v_definition_id;
  end if;

  -- Frontend Builder.
  select id into v_definition_id
    from public.agent_definitions
   where key = 'FRONTEND_BUILDER';

  if v_definition_id is null then
    raise exception 'FRONTEND_BUILDER definition not found';
  end if;

  insert into public.agent_definition_versions (
    agent_definition_id,
    version,
    instructions,
    output_schema
  )
  select
    v_definition_id,
    2,
    $instr$You are the MintChipOS Frontend Builder. Build a responsive, mobile-first, production-quality ONE_PAGE or FIVE_PAGE website from the provided brief, content strategy, creative direction, asset audit, and asset plan.

Return only valid JSON with these top-level fields:
- siteFormat: ONE_PAGE or FIVE_PAGE
- html: the complete website HTML
- sourceFiles: an array of generated source file names
- buildId: a stable build identifier string
- buildResult: OK or a failure description$instr$,
    $schema${
      "type": "object",
      "required": ["siteFormat", "html", "sourceFiles", "buildId", "buildResult"],
      "properties": {
        "siteFormat": { "type": "string", "enum": ["ONE_PAGE", "FIVE_PAGE"] },
        "html": { "type": "string" },
        "sourceFiles": { "type": "array", "items": { "type": "string" } },
        "buildId": { "type": "string" },
        "buildResult": { "type": "string" }
      }
    }$schema$::jsonb
  where not exists (
    select 1
    from public.agent_definition_versions
    where agent_definition_id = v_definition_id
      and version = 2
  )
  returning id into v_version_id;

  if v_version_id is not null then
    update public.agent_definitions
       set current_version_id = v_version_id,
           updated_at = now()
     where id = v_definition_id;
  end if;

  -- Visual QA.
  select id into v_definition_id
    from public.agent_definitions
   where key = 'VISUAL_QA';

  if v_definition_id is null then
    raise exception 'VISUAL_QA definition not found';
  end if;

  insert into public.agent_definition_versions (
    agent_definition_id,
    version,
    instructions,
    output_schema
  )
  select
    v_definition_id,
    2,
    $instr$You are the MintChipOS Visual QA reviewer. Inspect the provided rendered HTML/screenshots against the Design Direction Brief, Creative Direction, and Industry Playbook.

Evaluate hierarchy, composition, spacing, typography, imagery, polish, consistency, brand fidelity, visual balance, mobile quality, CTA clarity, generic/template feeling, and creative adherence.

Return only valid JSON with these top-level fields:
- passed: boolean
- checks: array of objects with name, passed, and detail
- defects: array of strings$instr$,
    $schema${
      "type": "object",
      "required": ["passed", "checks", "defects"],
      "properties": {
        "passed": { "type": "boolean" },
        "checks": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["name", "passed", "detail"],
            "properties": {
              "name": { "type": "string" },
              "passed": { "type": "boolean" },
              "detail": { "type": "string" }
            }
          }
        },
        "defects": { "type": "array", "items": { "type": "string" } }
      }
    }$schema$::jsonb
  where not exists (
    select 1
    from public.agent_definition_versions
    where agent_definition_id = v_definition_id
      and version = 2
  )
  returning id into v_version_id;

  if v_version_id is not null then
    update public.agent_definitions
       set current_version_id = v_version_id,
           updated_at = now()
     where id = v_definition_id;
  end if;
end;
$$;

