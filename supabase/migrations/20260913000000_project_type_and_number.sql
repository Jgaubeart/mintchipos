-- Canonical project types and atomic project-number allocation.
-- This migration does not modify existing project rows.

-- Replace any existing project_type check constraints with the canonical set.
do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select c.conname
    from pg_constraint c
    join pg_class rel on rel.oid = c.conrelid
    join pg_namespace n on n.oid = rel.relnamespace
    where n.nspname = 'public'
      and rel.relname = 'projects'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%project_type%'
  loop
    execute format(
      'alter table public.projects drop constraint %I',
      constraint_record.conname
    );
  end loop;
end
$$;

alter table public.projects
  add constraint projects_project_type_check
  check (project_type in ('INTERNAL', 'CUSTOMER', 'PREVIEW'));

-- Dedicated sequence for atomic MintChip project-number allocation.
create sequence if not exists public.mintchip_project_number_seq;

select setval(
  'public.mintchip_project_number_seq',
  greatest(
    coalesce(
      (
        select max(
          nullif(regexp_replace(project_number, '^MC-', ''), '')::bigint
        )
        from public.projects
        where project_number ~ '^MC-[0-9]+$'
      ),
      0
    ),
    0
  )
);

revoke all on sequence public.mintchip_project_number_seq from public;
grant usage on sequence public.mintchip_project_number_seq to authenticated;

create or replace function public.next_mintchip_project_number()
returns text
language sql
as $$
  select 'MC-' || lpad(nextval('public.mintchip_project_number_seq')::text, 4, '0');
$$;

revoke all on function public.next_mintchip_project_number() from public;
grant execute on function public.next_mintchip_project_number() to authenticated;
