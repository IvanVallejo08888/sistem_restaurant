-- Esquema de base de datos para Heladería Antojos (Fase 2).
-- Ejecutar en el SQL Editor de Supabase (Database > SQL Editor > New query).
--
-- Los IDs se generan en la aplicación (uid() en src/lib/utils.ts), por lo que
-- las columnas "id" son texto y no usan gen_random_uuid() por defecto.
--
-- RLS queda habilitado sin policies: el backend accede con la
-- SUPABASE_SERVICE_ROLE_KEY (que ignora RLS), y el resto de claves
-- (anon/authenticated) quedan sin acceso por defecto.

create table if not exists locales (
  id         text primary key,
  nombre     text not null,
  direccion  text not null,
  password   text not null,
  activo     boolean not null default true,
  creado_en  timestamptz not null default now()
);

alter table locales enable row level security;

create table if not exists productos (
  id         text primary key,
  local_id   text not null references locales(id) on delete cascade,
  nombre     text not null,
  valor      numeric not null default 0,
  creado_en  timestamptz not null default now()
);

create index if not exists productos_local_id_idx on productos(local_id);
alter table productos enable row level security;

create table if not exists domiciliarios (
  id              text primary key,
  local_id        text not null references locales(id) on delete cascade,
  nombre_completo text not null,
  correo          text not null,
  whatsapp        text not null,
  identificacion  text not null,
  foto_url        text not null default '',
  creado_en       timestamptz not null default now()
);

create index if not exists domiciliarios_local_id_idx on domiciliarios(local_id);
alter table domiciliarios enable row level security;

create table if not exists mesas (
  id         text primary key,
  local_id   text not null references locales(id) on delete cascade,
  nombre     text not null,
  creado_en  timestamptz not null default now()
);

create index if not exists mesas_local_id_idx on mesas(local_id);
alter table mesas enable row level security;

create table if not exists facturas (
  id                text primary key,
  local_id          text not null references locales(id) on delete cascade,
  consecutivo       integer not null,
  tipo              text not null,
  estado            text not null,
  -- Mesa
  mesa_id           text,
  mesa_nombre       text,
  -- Domicilio
  cliente_nombre    text,
  cliente_whatsapp  text,
  direccion         text,
  barrio            text,
  valor_domicilio   numeric,
  -- Comunes
  items             jsonb not null default '[]'::jsonb,
  metodo_pago       text not null,
  subtotal          numeric not null default 0,
  total             numeric not null default 0,
  creado_en         timestamptz not null default now(),
  -- Despacho
  despachado        boolean not null default false,
  domiciliario_id   text,
  servida           boolean,
  -- Reserva: fecha en la que se debe preparar (no aparece en Cocina antes de esa fecha)
  fecha_programada  date
);

create index if not exists facturas_local_id_idx on facturas(local_id);
alter table facturas enable row level security;

-- Si la tabla "facturas" ya existía antes de añadir la reserva, agrega la columna:
alter table facturas add column if not exists fecha_programada date;

create table if not exists gastos (
  id          text primary key,
  local_id    text not null references locales(id) on delete cascade,
  descripcion text not null,
  medio_pago  text not null default 'efectivo',
  valor       numeric not null default 0,
  creado_en   timestamptz not null default now()
);

create index if not exists gastos_local_id_idx on gastos(local_id);
alter table gastos enable row level security;

-- Si la tabla "gastos" ya existía antes de añadir el medio de pago, agrega la columna:
alter table gastos add column if not exists medio_pago text not null default 'efectivo';
