create schema if not exists ecc;

alter table ecc.leads
  add column if not exists instagram_handle text,
  add column if not exists session_id text,
  add column if not exists page_url text,
  add column if not exists first_seen_at timestamptz,
  add column if not exists last_seen_at timestamptz,
  add column if not exists first_utm_source text,
  add column if not exists first_utm_medium text,
  add column if not exists first_utm_campaign text,
  add column if not exists first_utm_content text,
  add column if not exists first_utm_term text,
  add column if not exists last_utm_source text,
  add column if not exists last_utm_medium text,
  add column if not exists last_utm_campaign text,
  add column if not exists last_utm_content text,
  add column if not exists last_utm_term text,
  add column if not exists first_referrer text,
  add column if not exists last_referrer text,
  add column if not exists fbclid text,
  add column if not exists gclid text;

update ecc.leads
set
  first_seen_at = coalesce(first_seen_at, created_at),
  last_seen_at = coalesce(last_seen_at, updated_at, created_at),
  first_utm_source = coalesce(first_utm_source, utm_source),
  first_utm_medium = coalesce(first_utm_medium, utm_medium),
  first_utm_campaign = coalesce(first_utm_campaign, utm_campaign),
  first_utm_content = coalesce(first_utm_content, utm_content),
  first_utm_term = coalesce(first_utm_term, utm_term),
  last_utm_source = coalesce(last_utm_source, utm_source),
  last_utm_medium = coalesce(last_utm_medium, utm_medium),
  last_utm_campaign = coalesce(last_utm_campaign, utm_campaign),
  last_utm_content = coalesce(last_utm_content, utm_content),
  last_utm_term = coalesce(last_utm_term, utm_term)
where first_seen_at is null or last_seen_at is null;

create index if not exists leads_session_id_idx on ecc.leads (session_id);
create index if not exists leads_instagram_handle_idx on ecc.leads (lower(instagram_handle));
create index if not exists leads_last_seen_at_idx on ecc.leads (last_seen_at desc);

create table if not exists ecc.lead_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  lead_id bigint references ecc.leads(id) on delete set null,
  session_id text,
  event_name text not null,
  page_path text,
  page_url text,
  source text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  fbclid text,
  gclid text,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists lead_events_created_at_idx on ecc.lead_events (created_at desc);
create index if not exists lead_events_lead_id_idx on ecc.lead_events (lead_id);
create index if not exists lead_events_session_id_idx on ecc.lead_events (session_id);
create index if not exists lead_events_event_name_idx on ecc.lead_events (event_name);
create index if not exists lead_events_utm_campaign_idx on ecc.lead_events (utm_campaign);

alter table ecc.lead_events enable row level security;

comment on table ecc.lead_events is 'Eventos de visitas, modal e conversao ligados a leads ou sessoes anonimas.';
