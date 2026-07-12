create schema if not exists ecc;

create table if not exists ecc.leads (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  product_slug text not null default 'empresa-com-claude',
  name text not null check (char_length(trim(name)) >= 2),
  email text not null check (position('@' in email) > 1),
  phone text not null check (char_length(trim(phone)) >= 8),
  source text,
  page_path text,
  checkout_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists leads_created_at_idx on ecc.leads (created_at desc);
create index if not exists leads_email_idx on ecc.leads (lower(email));
create index if not exists leads_product_slug_idx on ecc.leads (product_slug);
create index if not exists leads_source_idx on ecc.leads (source);

create or replace function ecc.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on ecc.leads;

create trigger leads_set_updated_at
before update on ecc.leads
for each row
execute function ecc.set_updated_at();

alter table ecc.leads enable row level security;

comment on schema ecc is 'Empresa com Claude';
comment on table ecc.leads is 'Leads capturados pelas landing pages Empresa com Claude.';
