# Heladería Antojos — Fase 2

Sistema de operación para Heladería Antojos. Esta es la **Fase 2**: incluye todo lo de la Fase 1 más reportes y estadísticas, compartir factura en PNG, ediciones inteligentes, despachador avanzado, cajero y una capa de servicios lista para conectar con backend (API Routes + Supabase/PostgreSQL).

## Tecnologías

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (sistema de diseño propio)
- **React Hook Form** + **Zod**
- **Zustand** (estado global)
- **html-to-image** (exportar factura a PNG)
- Diseño responsive, componentes reutilizables, arquitectura escalable

## Requisitos

- Node.js 18.18 o superior
- npm

## Instalación y ejecución

```bash
npm install
npm run dev
```

Abre http://localhost:3000

Producción:

```bash
npm run build
npm start
```

## Variables de entorno

```bash
cp .env.example .env.local
```

| Variable | Descripción | Por defecto |
|---|---|---|
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Contraseña del panel Admin | `admin123` |
| `NEXT_PUBLIC_BUSINESS_NAME` | Nombre del negocio | `Heladería Antojos` |
| `NEXT_PUBLIC_USE_BACKEND` | Activa el backend HTTP (API Routes + Supabase) | `false` |
| `SUPABASE_URL` | URL del proyecto de Supabase (Project Settings > API) | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key de Supabase (secreta, solo servidor) | — |
| `AUTH_SECRET` | (Futuro) Secreto de autenticación | — |

## Novedades de la Fase 2

### 1. Reportes y estadísticas (Admin -> Reportes)
Perfil desplegable por local con: caja del día, utilidad del día (descontando gastos editables), gastos del día, caja desglosada por método de pago (solo los usados), ingresos de mesas por método, ingresos por domiciliario (efectivo/transferencia, sin sumar domicilios) y rankings con gráficas de barrios, clientes (por WhatsApp) y productos más/menos vendidos.

### 2. Compartir factura
Desde el historial y el despachador: vista de factura electrónica, exportación a **PNG** y **compartir** con el sistema nativo del dispositivo (con descarga como respaldo).

### 3. Ediciones inteligentes
Al editar una factura ya preparada:
- Si **se agregan productos**, los nuevos se marcan con fondo rosado y la factura **vuelve a cocina**.
- Si solo cambian **método de pago, barrio o datos administrativos**, **no** vuelve a cocina y pasa directo al **despachador**.

### 4. Despachador avanzado
- **Mesas**: cajón "Ya servidas" tipo playlist; mover entre estados, consultar y abrir detalle.
- **Domicilios**: asignación a domiciliarios con botón "+".
- **Domiciliarios**: perfiles con foto, nombre y WhatsApp; al abrir, tabla con barrio y total por factura, botón "-" para retirar y devolver a pendientes.

### 5. Cajero
Domiciliarios con actividad del día. Al abrir cada uno se calcula el **efectivo a entregar**:
- Facturas en efectivo: suma solo productos (no el domicilio).
- Facturas por transferencia: resta únicamente el domicilio.

### 6-8. Mesas, domiciliarios y caja del día
Ingresos de mesas separados por método (efectivo, Nequi, Bancolombia, Daviplata, datáfono); ingresos por domiciliario separando efectivo/transferencia sin sumar domicilios; y "Caja del día" como botón desplegable que muestra solo los medios utilizados.

### 9. Backend real con Supabase (PostgreSQL)
LocalStorage se reemplazó por una **capa de servicios** (`src/services/`):
- `types.ts`: el contrato `DataService` que usa toda la app.
- `localStorageService.ts`: implementación sobre LocalStorage (modo demo, sin backend).
- `httpService.ts`: implementación HTTP que llama a las API Routes (`/api/...`).
- `index.ts`: elige la implementación según `NEXT_PUBLIC_USE_BACKEND`.

Las API Routes viven en `src/app/api/` y usan el cliente de Supabase (`src/lib/supabase.ts`) más los mapeos camelCase <-> snake_case de `src/lib/mappers.ts`.

#### Cómo activar el backend

1. Crea un proyecto en [Supabase](https://supabase.com).
2. En el **SQL Editor** del proyecto, ejecuta el script `supabase/schema.sql` (crea las tablas `locales`, `productos`, `domiciliarios`, `mesas`, `facturas`).
3. En **Project Settings > API**, copia la `Project URL` y la `service_role` key.
4. En `.env.local`, configura:

   ```bash
   NEXT_PUBLIC_USE_BACKEND=true
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

5. Reinicia `npm run dev`. La app ahora persiste en Supabase en vez de LocalStorage; la interfaz de usuario no cambia.

> `SUPABASE_SERVICE_ROLE_KEY` es secreta (sin prefijo `NEXT_PUBLIC_`) y solo se usa dentro de las API Routes, nunca se expone al navegador.

#### Limitación conocida

`asignarDomiciliario(facturaId, null)` (quitar un domiciliario asignado) actualiza el estado local correctamente, pero al usar el backend HTTP el campo `domiciliarioId: undefined` no viaja en el body JSON (se elimina al serializar), por lo que la columna `domiciliario_id` no se limpia en la base de datos. Para soportarlo con backend habría que permitir `null` explícito en `Factura.domiciliarioId` y en `updateFactura`.

## Estructura del proyecto

```
src/
├── app/                    # Rutas: /, /admin, /facturacion, /cocina, /despachador, /cajero
├── components/
│   ├── ui/                 # Button, Input, Modal, Card, BarChart, etc.
│   ├── layout/             # AreaShell, SideNav
│   ├── admin/              # Locales, Carta, Domiciliarios, Mesas, Reportes
│   ├── facturacion/        # Facturar, Historial, edición inteligente, compartir PNG
│   ├── cocina/             # Tablero tipo historias (resalta productos nuevos)
│   ├── despachador/        # Despachador avanzado (cajón servidas, asignación, perfiles)
│   └── cajero/             # Cuadre de efectivo por domiciliario
├── services/               # Capa de servicios (contrato + implementaciones)
├── store/                  # Zustand: dataStore (vía servicios), sessionStore
├── lib/                    # utils, storage, factura, reportes, sound
├── schemas/                # Validación Zod
└── types/                  # Modelo de dominio
```

## Flujo de prueba sugerido

1. **Admin** (`admin123`) -> crea un local, su carta, mesas y domiciliarios.
2. **Facturación** (contraseña del local) -> crea facturas de mesa y domicilio.
3. **Cocina** -> marca facturas como listas (suena al llegar).
4. **Despachador** -> asigna domicilios a domiciliarios; sirve mesas al cajón "Ya servidas".
5. **Cajero** -> revisa el efectivo a entregar por domiciliario.
6. **Admin -> Reportes** -> abre el perfil del local para ver caja, utilidad y rankings.
7. Edita una factura ya lista agregando un producto: vuelve a cocina marcado en rosado.

## Notas

- El sonido se genera con WebAudio (sin archivos). Algunos navegadores requieren una interacción previa para reproducir audio.
- "Compartir" usa la Web Share API con archivos; en dispositivos sin soporte, descarga el PNG.
- Reportes usan la fecha local del navegador para "hoy".
