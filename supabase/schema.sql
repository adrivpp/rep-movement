create type public.app_role as enum ('admin', 'member');
create type public.product_status as enum (
  'draft', 'in_progress', 'ready_to_submit', 'submitted', 'needs_changes',
  'approved', 'ready_for_shopify', 'exported', 'published'
);
create type public.colorway_status as enum (
  'coming_soon', 'available', 'low_stock', 'sold_out', 'preorder', 'restocked', 'archived'
);
create type public.drop_status as enum ('draft', 'coming_soon', 'live', 'ended', 'archived');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  role public.app_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  handle text not null unique,
  vendor text not null default 'REP.MOVEMENT',
  product_type text,
  short_description text,
  description text,
  status public.product_status not null default 'draft',
  completion_percentage integer not null default 0 check (completion_percentage between 0 and 100),
  seo_title text,
  seo_description text,
  template_id uuid references public.templates(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  approved_at timestamptz
);

create table public.colors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  hex text,
  swatch text,
  color_family text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_colorways (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  color_id uuid references public.colors(id) on delete set null,
  color_name_snapshot text not null,
  status public.colorway_status not null default 'coming_soon',
  is_permanent boolean not null default true,
  is_limited boolean not null default false,
  preorder_enabled boolean not null default false,
  preorder_start timestamptz,
  preorder_end timestamptz,
  preorder_shipping_estimate text,
  preorder_message text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, color_name_snapshot)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  colorway_id uuid references public.product_colorways(id) on delete cascade,
  sku text not null unique,
  price numeric(10,2) not null default 0 check (price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price >= 0),
  cost numeric(10,2) check (cost >= 0),
  stock integer not null default 0 check (stock >= 0),
  weight numeric(10,3) check (weight >= 0),
  weight_unit text not null default 'kg',
  barcode text,
  color text,
  size text,
  option_1_name text,
  option_1_value text,
  option_2_name text,
  option_2_value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  colorway_id uuid references public.product_colorways(id) on delete cascade,
  storage_path text not null,
  url text not null,
  alt_text text,
  image_type text not null default 'other',
  position integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_tags (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  unique (product_id, tag)
);

create table public.product_metafields (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  namespace text not null,
  key text not null,
  value text not null,
  type text not null default 'single_line_text_field',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, namespace, key)
);

create table public.product_specs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references public.products(id) on delete cascade,
  fabric text,
  composition text,
  fit text,
  compression text,
  stretch text,
  support text,
  rise text,
  length text,
  activity text,
  model_height text,
  model_size text,
  care_instructions text,
  country_of_origin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.drops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  description text,
  status public.drop_status not null default 'draft',
  release_date date,
  release_time time,
  timezone text not null default 'America/New_York',
  hero_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.drop_products (
  id uuid primary key default gen_random_uuid(),
  drop_id uuid not null references public.drops(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  position integer not null default 0,
  unique (drop_id, product_id)
);

create table public.drop_colorways (
  id uuid primary key default gen_random_uuid(),
  drop_id uuid not null references public.drops(id) on delete cascade,
  colorway_id uuid not null references public.product_colorways(id) on delete cascade,
  position integer not null default 0,
  unique (drop_id, colorway_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  comment text not null,
  type text not null default 'general',
  created_at timestamptz not null default now()
);

create table public.template_fields (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  field_name text not null,
  field_label text not null,
  field_type text not null,
  required boolean not null default false,
  help_text text,
  position integer not null default 0,
  options jsonb not null default '{}'::jsonb,
  validation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles', 'templates', 'template_fields', 'products', 'colors',
    'product_colorways', 'product_variants', 'product_images', 'product_tags',
    'product_metafields', 'product_specs', 'drops', 'drop_products',
    'drop_colorways', 'reviews', 'audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy "Authenticated users can read %1$s" on public.%1$I for select to authenticated using (true)',
      table_name
    );
    execute format(
      'create policy "Authenticated users can write %1$s" on public.%1$I for all to authenticated using (true) with check (true)',
      table_name
    );
  end loop;
end $$;

create index products_status_idx on public.products(status);
create index product_variants_product_id_idx on public.product_variants(product_id);
create index product_colorways_product_id_idx on public.product_colorways(product_id);
create index product_images_product_id_idx on public.product_images(product_id);
create index drops_release_date_idx on public.drops(release_date);

insert into public.templates (name, description)
values ('REP ACTIVEWEAR', 'Standard REP.MOVEMENT activewear product intake')
on conflict (name) do nothing;

insert into public.template_fields (template_id, field_name, field_label, field_type, required, position)
select id, fields.field_name, fields.field_label, 'text', true, fields.position
from public.templates
cross join (values
  ('fabric', 'Fabric', 1),
  ('composition', 'Composition', 2),
  ('fit', 'Fit', 3),
  ('compression', 'Compression', 4),
  ('stretch', 'Stretch', 5),
  ('support', 'Support', 6),
  ('rise', 'Rise', 7),
  ('length', 'Length', 8),
  ('activity', 'Activity', 9),
  ('model_height', 'Model height', 10),
  ('model_size', 'Model size', 11),
  ('care_instructions', 'Care instructions', 12),
  ('country_of_origin', 'Country of origin', 13)
) as fields(field_name, field_label, position)
where public.templates.name = 'REP ACTIVEWEAR'
  and not exists (
    select 1
    from public.template_fields existing
    where existing.template_id = public.templates.id
      and existing.field_name = fields.field_name
  );
