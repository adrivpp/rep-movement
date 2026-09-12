create type public.app_role as enum ('admin', 'client');
create type public.product_status as enum ('draft', 'in_progress', 'ready_to_submit', 'submitted', 'needs_changes', 'approved');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  role public.app_role not null default 'client',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'client',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null default '',
  handle text not null default '',
  vendor text,
  product_type text,
  description text,
  short_description text,
  status public.product_status not null default 'draft',
  completion_percentage integer not null default 0 check (completion_percentage between 0 and 100),
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  unique (organization_id, handle)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null,
  price numeric(10,2) not null default 0,
  compare_at_price numeric(10,2),
  cost numeric(10,2),
  stock integer not null default 0 check (stock >= 0),
  weight numeric(10,3),
  weight_unit text not null default 'kg',
  barcode text,
  color text,
  size text,
  option_1_name text,
  option_1_value text,
  option_2_name text,
  option_2_value text,
  option_3_name text,
  option_3_value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, sku)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  url text not null,
  alt_text text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.product_tags (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  tag text not null,
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
  updated_at timestamptz not null default now()
);

create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  admin_id uuid not null references auth.users(id),
  comment text not null,
  created_at timestamptz not null default now()
);

create table public.product_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.template_fields (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.product_templates(id) on delete cascade,
  field_name text not null,
  field_label text not null,
  field_type text not null,
  required boolean not null default false,
  help_text text,
  position integer not null default 0,
  options jsonb not null default '{}'::jsonb,
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

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id and user_id = auth.uid()
  );
$$;

create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(value, 'workspace')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
  base_name text;
  base_slug text;
begin
  base_name := coalesce(new.raw_user_meta_data->>'organization_name', split_part(new.email, '@', 1) || ' Studio');
  base_slug := public.slugify(base_name) || '-' || substr(new.id::text, 1, 8);

  insert into public.organizations (name, slug)
  values (base_name, base_slug)
  returning id into org_id;

  insert into public.profiles (user_id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'client')
  );

  insert into public.organization_members (organization_id, user_id, role)
  values (
    org_id,
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'client')
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_tags enable row level security;
alter table public.product_metafields enable row level security;
alter table public.product_reviews enable row level security;
alter table public.product_templates enable row level security;
alter table public.template_fields enable row level security;

create policy "Profiles are visible to owner or admins" on public.profiles for select using (user_id = auth.uid() or public.is_admin());
create policy "Users update own profile" on public.profiles for update using (user_id = auth.uid());

create policy "Organizations visible to members or admins" on public.organizations for select using (public.is_admin() or public.is_org_member(id));
create policy "Admins manage organizations" on public.organizations for all using (public.is_admin()) with check (public.is_admin());

create policy "Members visible in their organizations" on public.organization_members for select using (public.is_admin() or public.is_org_member(organization_id));
create policy "Admins manage members" on public.organization_members for all using (public.is_admin()) with check (public.is_admin());

create policy "Products visible to org members or admins" on public.products for select using (public.is_admin() or public.is_org_member(organization_id));
create policy "Members create products in own org" on public.products for insert with check (public.is_admin() or public.is_org_member(organization_id));
create policy "Members update products in own org" on public.products for update using (public.is_admin() or public.is_org_member(organization_id));
create policy "Admins delete products" on public.products for delete using (public.is_admin());

create policy "Product children visible through product access" on public.product_variants for select using (exists (select 1 from public.products p where p.id = product_id and (public.is_admin() or public.is_org_member(p.organization_id))));
create policy "Product children insert through product access" on public.product_variants for insert with check (exists (select 1 from public.products p where p.id = product_id and (public.is_admin() or public.is_org_member(p.organization_id))));
create policy "Product children update through product access" on public.product_variants for update using (exists (select 1 from public.products p where p.id = product_id and (public.is_admin() or public.is_org_member(p.organization_id))));
create policy "Product children delete through product access" on public.product_variants for delete using (exists (select 1 from public.products p where p.id = product_id and (public.is_admin() or public.is_org_member(p.organization_id))));

create policy "Images visible through product access" on public.product_images for all using (exists (select 1 from public.products p where p.id = product_id and (public.is_admin() or public.is_org_member(p.organization_id)))) with check (exists (select 1 from public.products p where p.id = product_id and (public.is_admin() or public.is_org_member(p.organization_id))));
create policy "Tags visible through product access" on public.product_tags for all using (exists (select 1 from public.products p where p.id = product_id and (public.is_admin() or public.is_org_member(p.organization_id)))) with check (exists (select 1 from public.products p where p.id = product_id and (public.is_admin() or public.is_org_member(p.organization_id))));
create policy "Metafields visible through product access" on public.product_metafields for all using (exists (select 1 from public.products p where p.id = product_id and (public.is_admin() or public.is_org_member(p.organization_id)))) with check (exists (select 1 from public.products p where p.id = product_id and (public.is_admin() or public.is_org_member(p.organization_id))));
create policy "Reviews visible through product access" on public.product_reviews for select using (exists (select 1 from public.products p where p.id = product_id and (public.is_admin() or public.is_org_member(p.organization_id))));
create policy "Admins create reviews" on public.product_reviews for insert with check (public.is_admin());

create policy "Templates visible to org members or admins" on public.product_templates for select using (public.is_admin() or organization_id is null or public.is_org_member(organization_id));
create policy "Admins manage templates" on public.product_templates for all using (public.is_admin()) with check (public.is_admin());
create policy "Template fields visible through templates" on public.template_fields for select using (exists (select 1 from public.product_templates t where t.id = template_id and (public.is_admin() or t.organization_id is null or public.is_org_member(t.organization_id))));
create policy "Admins manage template fields" on public.template_fields for all using (public.is_admin()) with check (public.is_admin());

create index product_variants_product_id_idx on public.product_variants(product_id);
create index product_images_product_id_idx on public.product_images(product_id);
create index products_organization_status_idx on public.products(organization_id, status);
