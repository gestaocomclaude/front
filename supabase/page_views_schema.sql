create schema if not exists ecc;

create table if not exists ecc.page_views (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  page_path text not null,
  page_url text,
  title text,
  referrer text,
  session_id text,
  source text not null default 'front-page-view',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  viewport_width integer,
  viewport_height integer,
  screen_width integer,
  screen_height integer,
  language text,
  timezone text,
  ip_address inet,
  user_agent text,
  utms jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists page_views_created_at_idx on ecc.page_views (created_at desc);
create index if not exists page_views_page_path_idx on ecc.page_views (page_path);
create index if not exists page_views_session_id_idx on ecc.page_views (session_id);
create index if not exists page_views_utm_campaign_idx on ecc.page_views (utm_campaign);

alter table ecc.page_views enable row level security;

comment on table ecc.page_views is 'Visualizacoes de paginas do front para analise de trafego.';
