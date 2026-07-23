create schema if not exists ecc;

create table if not exists ecc.video_pages (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  slug text not null unique,
  title text not null,
  video_url text not null,
  video_type text not null default 'mp4',
  source_video_url text,
  stream_url text,
  processing_status text not null default 'ready',
  processing_error text,
  processed_at timestamptz,
  play_button_label text not null default 'clique para assistir',
  cta_label text not null,
  cta_url text not null,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  constraint video_pages_slug_format_chk check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

alter table ecc.video_pages
  add column if not exists play_button_label text not null default 'clique para assistir';

alter table ecc.video_pages
  add column if not exists video_type text not null default 'mp4',
  add column if not exists source_video_url text,
  add column if not exists stream_url text,
  add column if not exists processing_status text not null default 'ready',
  add column if not exists processing_error text,
  add column if not exists processed_at timestamptz;

alter table ecc.video_pages
  drop constraint if exists video_pages_video_type_chk,
  add constraint video_pages_video_type_chk check (video_type in ('mp4', 'hls'));

alter table ecc.video_pages
  drop constraint if exists video_pages_processing_status_chk,
  add constraint video_pages_processing_status_chk check (processing_status in ('pending', 'processing', 'ready', 'failed'));

create table if not exists ecc.video_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  page_id bigint references ecc.video_pages(id) on delete set null,
  slug text not null,
  event_type text not null,
  session_id text not null,
  lead_id bigint,
  page_url text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  watched_seconds numeric(12, 3),
  video_duration numeric(12, 3),
  progress_percent numeric(6, 2),
  viewport_width integer,
  viewport_height integer,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  constraint video_events_type_chk check (
    event_type in (
      'page_view',
      'video_preload_started',
      'play_started',
      'progress_25',
      'progress_50',
      'progress_75',
      'video_completed',
      'cta_revealed',
      'cta_clicked'
    )
  )
);

create table if not exists ecc.video_sessions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  page_id bigint references ecc.video_pages(id) on delete set null,
  slug text not null,
  session_id text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  play_started_at timestamptz,
  completed_at timestamptz,
  cta_revealed_at timestamptz,
  cta_clicked_at timestamptz,
  max_progress_percent numeric(6, 2) not null default 0,
  watched_seconds numeric(12, 3),
  video_duration numeric(12, 3),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  constraint video_sessions_page_session_unique unique (page_id, session_id)
);

create index if not exists video_pages_slug_idx on ecc.video_pages (slug);
create index if not exists video_pages_active_idx on ecc.video_pages (is_active);

create index if not exists video_events_created_at_idx on ecc.video_events (created_at desc);
create index if not exists video_events_slug_created_at_idx on ecc.video_events (slug, created_at desc);
create index if not exists video_events_type_idx on ecc.video_events (event_type);
create index if not exists video_events_session_id_idx on ecc.video_events (session_id);
create index if not exists video_events_utm_source_idx on ecc.video_events (utm_source);
create index if not exists video_events_utm_campaign_idx on ecc.video_events (utm_campaign);

create index if not exists video_sessions_slug_idx on ecc.video_sessions (slug);
create index if not exists video_sessions_updated_at_idx on ecc.video_sessions (updated_at desc);
create index if not exists video_sessions_utm_source_idx on ecc.video_sessions (utm_source);
create index if not exists video_sessions_utm_campaign_idx on ecc.video_sessions (utm_campaign);

alter table ecc.video_pages enable row level security;
alter table ecc.video_events enable row level security;
alter table ecc.video_sessions enable row level security;

comment on table ecc.video_pages is 'Configuracao dinamica das paginas publicas de video.';
comment on table ecc.video_events is 'Eventos detalhados de visualizacao das paginas de video.';
comment on table ecc.video_sessions is 'Resumo consolidado por sessao para metricas de video.';
