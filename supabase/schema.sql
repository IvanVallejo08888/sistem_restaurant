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
  -- 'heladeria' | 'comidas-rapidas'; la validación ocurre en la app
  categoria  text not null default 'heladeria',
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
  -- Reservas: fecha (YYYY-MM-DD) y hora (HH:MM) en que se prepara el pedido.
  -- No aparece en Cocina antes de la fecha programada.
  fecha_programada  date,
  hora_reserva      text,            -- HH:MM; null si no es reserva
  -- Favor: tipo especial que salta cocina
  nombre_favor      text,            -- texto libre del favor
  medio_transferencia text,          -- 'nequi'|'bancolombia'|'daviplata'; solo si metodo_pago='mixto'
  descuento_domiciliario numeric,    -- descuento calculado al domiciliario asignado
  -- Pago mixto: efectivo + transferencia en la misma factura
  valor_efectivo    numeric,         -- parte pagada en efectivo (solo cuando metodo_pago='mixto')
  valor_transferencia numeric,       -- parte pagada por transferencia (solo cuando metodo_pago='mixto')
  -- Validaciones de cocina (persisten en BD para sobrevivir recargas)
  heladeria_lista   boolean not null default false,
  comidas_listas    boolean not null default false,
  -- Soft delete: no se elimina físicamente, solo se marca con fecha
  deleted_at        timestamptz      -- null = activo; fecha = eliminada
);

create index if not exists facturas_local_id_idx on facturas(local_id);
alter table facturas enable row level security;

-- Migraciones para tablas pre-existentes (ejecutar solo si la tabla ya existía)
alter table locales add column if not exists deleted_at timestamptz;
alter table productos add column if not exists categoria text not null default 'heladeria';

alter table facturas add column if not exists fecha_programada date;
alter table facturas add column if not exists hora_reserva text;
alter table facturas add column if not exists nombre_favor text;
alter table facturas add column if not exists medio_transferencia text;
alter table facturas add column if not exists descuento_domiciliario numeric;
alter table facturas add column if not exists deleted_at timestamptz;
alter table facturas add column if not exists heladeria_lista boolean not null default false;
alter table facturas add column if not exists comidas_listas boolean not null default false;
alter table facturas add column if not exists valor_efectivo numeric;
alter table facturas add column if not exists valor_transferencia numeric;

-- Índices por fecha para que las queries de "hoy" sean eficientes
create index if not exists facturas_creado_en_idx on facturas(creado_en);
create index if not exists gastos_creado_en_idx on gastos(creado_en);
-- medio_transferencia ya cubre nequi | bancolombia | daviplata | datafono (sin check constraint)

-- Los nuevos valores de "tipo" son: 'mesa','domicilio','favor','reserva-domicilio','reserva-mesa'
-- Los nuevos valores de "metodo_pago" son: 'efectivo','nequi','bancolombia','daviplata','datafono','mixto','domiciliario'
-- (sin check constraint para no romper datos existentes; la validación ocurre en la app)

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
