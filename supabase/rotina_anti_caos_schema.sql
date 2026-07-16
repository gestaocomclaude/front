create schema if not exists ecc;

create or replace function ecc.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists ecc.rotina_anti_caos_responses (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submission_id text,
  name text not null check (char_length(trim(name)) >= 2),
  email text,
  phone_country_code text,
  phone_country_name text,
  phone_ddd text,
  phone_number text,
  phone text,
  equipe text,
  fase_negocio text,
  dias_semana text[] not null default '{}'::text[],
  horario_cliente text,
  acordar time,
  dormir time,
  expediente jsonb not null default '{}'::jsonb,
  almoco_horario time,
  almoco_duracao text,
  compromissos jsonb not null default '[]'::jsonb,
  habitos text[] not null default '{}'::text[],
  inimigo_habitos text,
  periodo_produtivo text,
  esquentar text,
  horas_sono text,
  tempo_pra_si_duracao text,
  tempo_pra_si_descricao text,
  hobby text,
  canais_conteudo text[] not null default '{}'::text[],
  canais_conteudo_tempo text,
  tempo_comercial text,
  tempo_gestao text,
  atendimento_padrao text,
  saude text,
  rotina_desanda text,
  angustia_desejo text,
  source text not null default 'rotina-anti-caos',
  page_path text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  ip_address inet,
  user_agent text,
  answers jsonb not null default '{}'::jsonb,
  routine jsonb not null default '{}'::jsonb,
  utms jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);

alter table ecc.rotina_anti_caos_responses
  add column if not exists email text,
  add column if not exists phone_country_code text,
  add column if not exists phone_country_name text,
  add column if not exists phone_ddd text,
  add column if not exists phone_number text,
  add column if not exists phone text;

create index if not exists rotina_anti_caos_created_at_idx on ecc.rotina_anti_caos_responses (created_at desc);
create unique index if not exists rotina_anti_caos_submission_id_key on ecc.rotina_anti_caos_responses (submission_id);
create index if not exists rotina_anti_caos_name_idx on ecc.rotina_anti_caos_responses (lower(name));
create index if not exists rotina_anti_caos_email_idx on ecc.rotina_anti_caos_responses (lower(email));
create index if not exists rotina_anti_caos_phone_idx on ecc.rotina_anti_caos_responses (phone);
create index if not exists rotina_anti_caos_fase_negocio_idx on ecc.rotina_anti_caos_responses (fase_negocio);
create index if not exists rotina_anti_caos_rotina_desanda_idx on ecc.rotina_anti_caos_responses (rotina_desanda);
create index if not exists rotina_anti_caos_habitos_gin_idx on ecc.rotina_anti_caos_responses using gin (habitos);
create index if not exists rotina_anti_caos_canais_gin_idx on ecc.rotina_anti_caos_responses using gin (canais_conteudo);

drop trigger if exists rotina_anti_caos_set_updated_at on ecc.rotina_anti_caos_responses;

create trigger rotina_anti_caos_set_updated_at
before update on ecc.rotina_anti_caos_responses
for each row
execute function ecc.set_updated_at();

alter table ecc.rotina_anti_caos_responses enable row level security;

comment on table ecc.rotina_anti_caos_responses is 'Respostas do questionario Rotina Anti-Caos para analise futura.';
