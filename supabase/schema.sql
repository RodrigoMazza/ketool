-- ============================================================
-- Extranet — Schema completo para Supabase
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================================

-- Clientes (empresas)
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Usuarios (sincronizados con auth.users)
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text check (role in ('admin', 'client')) not null,
  client_id uuid references clients(id),
  created_at timestamptz default now()
);

-- Categorías de plantillas
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

-- Biblioteca de fuentes tipográficas
create table if not exists fonts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  file_url text not null,
  created_at timestamptz default now()
);

-- Plantillas
create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references categories(id),
  pdf_url text not null,
  thumbnail_url text not null,
  font_id uuid references fonts(id),
  default_color text default '#000000',
  is_active boolean default true,
  png_width integer not null default 1080,
  png_height integer not null default 1080,
  created_at timestamptz default now()
);

-- Campos editables de cada plantilla
create table if not exists template_fields (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references templates(id) on delete cascade,
  field_key text not null,
  label text not null,
  field_type text check (field_type in ('text', 'textarea', 'date', 'qr')) not null,
  required boolean default true,
  sort_order integer default 0,
  qr_x float,
  qr_y float,
  qr_size float,
  field_metadata jsonb                   -- coordenadas del marcador para text/textarea/date
);

-- Asignación de plantillas a clientes
create table if not exists template_clients (
  template_id uuid references templates(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  primary key (template_id, client_id)
);

-- Historial de descargas
create table if not exists downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  template_id uuid references templates(id),
  format text check (format in ('pdf', 'png')) not null,
  field_data jsonb not null,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- Nota: las políticas de admin usan app_metadata para evitar
-- recursión en la tabla users. Configurar via Supabase hook:
-- Auth > Hooks > Custom access token hook
-- que lea users.role y lo agregue a app_metadata.role
-- ============================================================

alter table clients enable row level security;
alter table users enable row level security;
alter table categories enable row level security;
alter table fonts enable row level security;
alter table templates enable row level security;
alter table template_fields enable row level security;
alter table template_clients enable row level security;
alter table downloads enable row level security;

-- ============================================================
-- Admin check via JWT app_metadata — no DB query, no recursion, no lock issues.
-- is_admin() (SECURITY DEFINER querying users) is intentionally NOT used:
--   • For users table: would cause infinite RLS recursion.
--   • For other tables: is_admin() queries users, which evaluates RLS on users,
--     which can fail silently on INSERT/UPDATE WITH CHECK paths in some Postgres
--     configurations. JWT claims are evaluated in-process with zero risk.
--
-- Prerequisite: admin user must have app_metadata set in Supabase Dashboard:
--   Authentication → Users → click user → Edit → Raw App Meta Data:
--   {"provider":"email","providers":["email"],"role":"admin"}
-- ============================================================

-- CLIENTS
create policy "admin_all_clients" on clients
  for all to authenticated
  using      ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "client_read_own" on clients
  for select to authenticated using (
    id = (select client_id from users where id = auth.uid())
  );

-- USERS
create policy "users_read_own" on users
  for select to authenticated using (id = auth.uid());
create policy "admin_all_users" on users
  for all to authenticated
  using      ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- FONTS
create policy "admin_all_fonts" on fonts
  for all to authenticated
  using      ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "authenticated_read_fonts" on fonts
  for select to authenticated using (true);

-- CATEGORIES
create policy "admin_all_categories" on categories
  for all to authenticated
  using      ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "authenticated_read_categories" on categories
  for select to authenticated using (true);

-- TEMPLATES
create policy "admin_all_templates" on templates
  for all to authenticated
  using      ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "client_read_assigned_templates" on templates
  for select to authenticated using (
    is_active = true and id in (
      select tc.template_id from template_clients tc
      join users u on u.client_id = tc.client_id
      where u.id = auth.uid()
    )
  );

-- TEMPLATE_FIELDS
create policy "admin_all_fields" on template_fields
  for all to authenticated
  using      ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "client_read_fields_for_assigned_templates" on template_fields
  for select to authenticated using (
    template_id in (
      select tc.template_id from template_clients tc
      join users u on u.client_id = tc.client_id
      where u.id = auth.uid()
    )
  );

-- TEMPLATE_CLIENTS
create policy "admin_all_tc" on template_clients
  for all to authenticated
  using      ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
-- Clients can read their own assignments.
-- Required for two reasons:
--   1. getTemplatesForClientDirect queries template_clients directly.
--   2. The client_read_assigned_templates policy on templates and
--      client_read_fields_for_assigned_templates on template_fields both
--      contain a subquery on template_clients — PostgreSQL applies RLS to
--      subqueries inside policies, so without this policy those subqueries
--      return empty sets and no templates are ever visible to clients.
create policy "client_read_own_tc" on template_clients
  for select to authenticated using (
    client_id = (select client_id from users where id = auth.uid())
  );

-- DOWNLOADS
create policy "admin_all_downloads" on downloads
  for all to authenticated
  using      ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "user_own_downloads_read" on downloads
  for select to authenticated using (user_id = auth.uid());
create policy "user_insert_own_downloads" on downloads
  for insert to authenticated with check (user_id = auth.uid());

-- ============================================================
-- Storage bucket
-- Crear manualmente en Supabase Dashboard > Storage:
-- Bucket name: templates
-- Public: true
-- Max file size: 52428800 (50 MB)
-- Allowed MIME types: image/*, application/pdf, font/*
-- ============================================================

-- ============================================================
-- Migration v1.2 — Biblioteca de fuentes
-- Ejecutar si ya tenés un schema v1.1 desplegado:
-- ============================================================
-- create table if not exists fonts (
--   id uuid primary key default gen_random_uuid(),
--   name text not null,
--   file_url text not null,
--   created_at timestamptz default now()
-- );
-- alter table fonts enable row level security;
-- create policy "admin_all_fonts" on fonts
--   for all to authenticated
--   using      ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
--   with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
-- create policy "authenticated_read_fonts" on fonts
--   for select to authenticated using (true);
-- alter table templates add column if not exists font_id uuid references fonts(id);
-- alter table templates drop column if exists font_url;
-- ============================================================

-- ============================================================
-- Migration v1.3 — Color por defecto de plantilla
-- Ejecutar si ya tenés un schema v1.2 desplegado:
-- ============================================================
-- alter table templates add column if not exists default_color text default '#000000';
-- ============================================================
