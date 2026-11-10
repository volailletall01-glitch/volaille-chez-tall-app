-- Poulet Pro — PostgreSQL / Supabase
-- Apply once in the Supabase SQL Editor. All tenant data is protected by RLS.

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  created_at timestamptz not null default now(),
  unique (id)
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager', 'worker', 'sales')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.create_farm(p_name text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  new_organization_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_name is null or length(trim(p_name)) not between 1 and 120 then
    raise exception 'Farm name must contain 1 to 120 characters';
  end if;

  insert into public.organizations (name) values (trim(p_name))
    returning id into new_organization_id;
  insert into public.organization_members (organization_id, user_id, role)
    values (new_organization_id, auth.uid(), 'owner');
  return new_organization_id;
end;
$$;

revoke all on function public.create_farm(text) from public;
grant execute on function public.create_farm(text) to authenticated;
revoke all on function public.is_org_member(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;

create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  strain text not null default '',
  arrival_date date not null,
  initial_count integer not null check (initial_count > 0),
  supplier text not null default '',
  chick_unit_cost numeric(14,2) not null default 0 check (chick_unit_cost >= 0),
  chick_total_cost numeric(16,2) not null default 0 check (chick_total_cost >= 0),
  transport_cost numeric(14,2) not null default 0 check (transport_cost >= 0),
  target_weight_kg numeric(8,3) not null default 2.2 check (target_weight_kg >= 0),
  target_age_days integer not null default 42 check (target_age_days between 1 and 120),
  status text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  unique (organization_id, name)
);

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  batch_id uuid not null,
  log_date date not null,
  mortality integer not null default 0 check (mortality >= 0),
  culls integer not null default 0 check (culls >= 0),
  feed_starter_kg numeric(12,3) not null default 0 check (feed_starter_kg >= 0),
  feed_grower_kg numeric(12,3) not null default 0 check (feed_grower_kg >= 0),
  feed_finisher_kg numeric(12,3) not null default 0 check (feed_finisher_kg >= 0),
  feed_cost numeric(14,2) not null default 0 check (feed_cost >= 0),
  water_liters numeric(12,2) not null default 0 check (water_liters >= 0),
  avg_weight_kg numeric(8,3) check (avg_weight_kg is null or avg_weight_kg >= 0),
  treatment text not null default '',
  health_cost numeric(14,2) not null default 0 check (health_cost >= 0),
  other_cost numeric(14,2) not null default 0 check (other_cost >= 0),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  unique (batch_id, log_date),
  foreign key (batch_id, organization_id) references public.batches(id, organization_id) on delete cascade
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  category text not null check (category in ('starter', 'grower', 'finisher', 'veterinary', 'bedding', 'heating', 'other')),
  unit text not null check (unit in ('kg', 'sac', 'litre', 'unité')),
  quantity numeric(14,3) not null default 0 check (quantity >= 0),
  min_quantity numeric(14,3) not null default 0 check (min_quantity >= 0),
  average_unit_cost numeric(14,2) not null default 0 check (average_unit_cost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  unique (organization_id, name, unit)
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  item_id uuid not null,
  batch_id uuid,
  movement_type text not null check (movement_type in ('purchase', 'consumption', 'adjustment', 'loss')),
  quantity_delta numeric(14,3) not null check (quantity_delta <> 0),
  unit_cost numeric(14,2) not null default 0 check (unit_cost >= 0),
  transport_cost numeric(14,2) not null default 0 check (transport_cost >= 0),
  movement_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  foreign key (item_id, organization_id) references public.inventory_items(id, organization_id) on delete cascade,
  foreign key (batch_id, organization_id) references public.batches(id, organization_id)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  phone text not null default '',
  email text not null default '',
  channel text not null default 'other' check (channel in ('wholesale', 'restaurant', 'supermarket', 'retail', 'other')),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id)
);

create table if not exists public.poultry_sales (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  batch_id uuid not null,
  client_id uuid,
  sale_date date not null,
  heads integer not null check (heads > 0),
  unit_weight_kg numeric(8,3) not null check (unit_weight_kg > 0),
  total_weight_kg numeric(12,3) not null check (total_weight_kg > 0),
  price_per_kg numeric(14,2) not null check (price_per_kg >= 0),
  total_amount numeric(16,2) not null check (total_amount >= 0),
  paid_amount numeric(16,2) not null default 0 check (paid_amount >= 0 and paid_amount <= total_amount),
  payment_method text not null default 'cash' check (payment_method in ('cash', 'mobile_money', 'transfer', 'credit')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  foreign key (batch_id, organization_id) references public.batches(id, organization_id),
  foreign key (client_id, organization_id) references public.clients(id, organization_id)
);

create table if not exists public.charges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  batch_id uuid,
  charge_date date not null,
  category text not null check (category in ('health', 'heating', 'labor', 'water_energy', 'delivery', 'bedding', 'maintenance', 'other')),
  description text not null check (length(trim(description)) between 1 and 160),
  amount numeric(16,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  foreign key (batch_id, organization_id) references public.batches(id, organization_id)
);

create index if not exists batches_org_status_idx on public.batches (organization_id, status, arrival_date desc);
create index if not exists daily_logs_org_date_idx on public.daily_logs (organization_id, log_date desc);
create index if not exists daily_logs_batch_date_idx on public.daily_logs (batch_id, log_date desc);
create index if not exists inventory_items_org_category_idx on public.inventory_items (organization_id, category);
create index if not exists inventory_movements_org_date_idx on public.inventory_movements (organization_id, movement_date desc);
create index if not exists poultry_sales_org_date_idx on public.poultry_sales (organization_id, sale_date desc);
create index if not exists poultry_sales_client_idx on public.poultry_sales (client_id, sale_date desc);
create index if not exists charges_org_date_idx on public.charges (organization_id, charge_date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'batches', 'daily_logs', 'inventory_items', 'inventory_movements',
    'clients', 'poultry_sales', 'charges'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
  end loop;
end;
$$;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.batches enable row level security;
alter table public.daily_logs enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.clients enable row level security;
alter table public.poultry_sales enable row level security;
alter table public.charges enable row level security;

drop policy if exists "members can read their organizations" on public.organizations;
create policy "members can read their organizations" on public.organizations
  for select to authenticated using (public.is_org_member(id));
drop policy if exists "members can read organization membership" on public.organization_members;
create policy "members can read organization membership" on public.organization_members
  for select to authenticated using (user_id = auth.uid() or public.is_org_member(organization_id));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'batches', 'daily_logs', 'inventory_items', 'inventory_movements',
    'clients', 'poultry_sales', 'charges'
  ] loop
    execute format('drop policy if exists "tenant access" on public.%I', table_name);
    execute format(
      'create policy "tenant access" on public.%I for all to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id))',
      table_name
    );
  end loop;
end;
$$;

grant usage on schema public to authenticated;
grant select on public.organizations, public.organization_members to authenticated;
grant select, insert, update, delete on
  public.batches, public.daily_logs, public.inventory_items, public.inventory_movements,
  public.clients, public.poultry_sales, public.charges
to authenticated;
