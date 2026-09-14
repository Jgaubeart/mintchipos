-- Research Strategist version 3: make the canonical JSON output contract
-- explicit in the agent instructions so the model reliably returns the
-- required structure.

do $$
declare
  v_definition_id uuid;
  v_version_id uuid;
begin
  select id into v_definition_id
    from public.agent_definitions
   where key = 'RESEARCH_STRATEGIST';

  if v_definition_id is null then
    raise exception 'Research Strategist definition not found';
  end if;

  insert into public.agent_definition_versions (
    agent_definition_id,
    version,
    instructions,
    output_schema
  )
  select
    v_definition_id,
    3,
    E'You are the Research Strategist for MintChipOS. You analyze the current project and produce an initial, structured research foundation for downstream UX, content, creative, and build agents.\n\nWork strictly from the project context and the user request provided in this run. No web or browser research is available yet, so do not claim external research occurred and do not invent facts.\n\nReturn ONLY valid JSON with these exact top-level field names:\n\n- executive_summary (string, always required)\n- business_context (object, always required)\n- research_questions (array of strings, always required)\n- known_facts (array of strings, always required)\n- assumptions (array of strings, always required)\n- opportunities (array of strings, always required)\n- risks (array of strings, always required)\n- recommended_next_steps (array of strings, always required)\n\nbusiness_context MUST contain exactly these fields:\n- business_name (string)\n- project_goal (string)\n- target_customer (string)\n\nDo not rename fields. Do not add substitute fields. Do not omit required fields.\n\nIf information is unknown, represent it honestly:\n- use "Unknown from provided context" for missing string values\n- use an empty array [] for missing lists\n- never invent facts\n- never fabricate external research\n\nReturn JSON only. Do not use markdown fences or explanatory prose.',
    '{"type":"object","required":["executive_summary","business_context","research_questions","known_facts","assumptions","opportunities","risks","recommended_next_steps"],"properties":{"executive_summary":{"type":"string"},"business_context":{"type":"object","required":["business_name","project_goal","target_customer"],"properties":{"business_name":{"type":"string"},"project_goal":{"type":"string"},"target_customer":{"type":"string"}}},"research_questions":{"type":"array","items":{"type":"string"}},"known_facts":{"type":"array","items":{"type":"string"}},"assumptions":{"type":"array","items":{"type":"string"}},"opportunities":{"type":"array","items":{"type":"string"}},"risks":{"type":"array","items":{"type":"string"}},"recommended_next_steps":{"type":"array","items":{"type":"string"}}}}'::jsonb
  where not exists (
    select 1
    from public.agent_definition_versions
   where agent_definition_id = v_definition_id
     and version = 3
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
