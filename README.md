# When2 Play

Coordina la disponibilidad de tu equipo sin cuentas, sin contraseñas y sin ir y venir de mensajes preguntando quién puede tal día.

Cada equipo crea una **sala** con un código corto, cada jugador marca en qué días y horas puede entrenar, y la app calcula automáticamente cuál es el mejor horario para juntar a la mayor cantidad de gente posible.

## Cómo funciona

1. Alguien crea una sala (le pone nombre, la app genera un código corto para compartir).
2. El código se comparte con el equipo - por WhatsApp, donde sea.
3. Cada jugador entra con el código, elige su nombre de una lista o se registra con nombre y número de camiseta, y marca su disponibilidad en un calendario semanal.
4. Cualquiera puede ver el resumen: un mapa de calor que muestra qué días y horas tienen más gente libre, con el detalle de quién está disponible en cada horario.

## Características

- Salas por código - sin registro, sin cuentas, cada equipo aislado del resto
- Calendario optimizado para móvil: toca para marcar una casilla, o activa "Marcar varias" para arrastrar el dedo y marcar varias
- Mapa de calor con leyenda y podio de los 3 mejores horarios
- Número de camiseta opcional por jugador

## Stack

- [Astro](https://astro.build) — frontend y API routes, renderizado en servidor
- [Supabase](https://supabase.com) — base de datos Postgres
- [Vercel](https://vercel.com) — hosting y cron jobs

## Configuración local

### 1. Clona e instala

\`\`\`bash
git clone https://github.com/TU-USUARIO/when2play.git
cd convoca
npm install
\`\`\`

### 2. Crea las tablas en Supabase

Crea un proyecto en [supabase.com](https://supabase.com) y en su **SQL Editor** corre:

\`\`\`sql
create extension if not exists "pgcrypto";

create table salas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  created_at timestamptz not null default now()
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  sala_id uuid not null references salas(id) on delete cascade,
  name text not null,
  numero integer,
  created_at timestamptz not null default now(),
  unique (sala_id, name)
);

create table availability (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  slot text not null,
  created_at timestamptz not null default now(),
  unique (participant_id, slot)
);

create index idx_participants_sala on participants(sala_id);
create index idx_availability_participant on availability(participant_id);
create index idx_availability_slot on availability(slot);

alter table salas enable row level security;
alter table participants enable row level security;
alter table availability enable row level security;

create policy "public read salas" on salas for select using (true);
create policy "public insert salas" on salas for insert with check (true);

create policy "public read participants" on participants for select using (true);
create policy "public insert participants" on participants for insert with check (true);

create policy "public read availability" on availability for select using (true);
create policy "public insert availability" on availability for insert with check (true);
create policy "public delete availability" on availability for delete using (true);
\`\`\`

Después, en **Project Settings → API**, copia el **Project URL** y la **service_role key**.

### 3. Variables de entorno

Crea un archivo \`.env\` en la raíz del proyecto:

\`\`\`
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
CRON_SECRET=un-string-aleatorio-largo
\`\`\`

### 4. Corre en local

\`\`\`bash
npm run dev
\`\`\`

Abre \`http://localhost:4321\`.

## Desplegar en Vercel

1. Sube el repo a GitHub e impórtalo en [vercel.com](https://vercel.com).
2. Agrega las mismas tres variables de entorno del paso anterior en **Settings → Environment Variables**.
3. Despliega. El cron definido en \`vercel.json\` empezará a correr automáticamente una vez al día para mantener despierta la base de datos.

## Estructura del proyecto

\`\`\`
when2play/
├── package.json
├── astro.config.mjs
├── vercel.json
├── .env                        (no se sube a git)
├── src/
│   ├── lib/
│   │   ├── supabase.ts         # cliente de Supabase
│   │   └── db.ts               # todas las consultas a la base de datos
│   ├── layouts/
│   │   └── Layout.astro        # header dinámico por sala
│   ├── styles/
│   │   └── global.css
│   └── pages/
│       ├── index.astro         # unirse a una sala / crear una sala
│       ├── sala/
│       │   ├── [codigo].astro                    # selección de jugador
│       │   └── [codigo]/
│       │       ├── disponibilidad.astro           # calendario personal
│       │       └── resumen.astro                  # mapa de calor del equipo
│       └── api/
│           ├── salas.ts
│           ├── participantes.ts
│           ├── disponibilidad.ts
│           ├── resumen.ts
│           └── keep-alive.ts   # endpoint que llama el cron
\`\`\`

## Notas

- No hay autenticación: cualquiera con el código de una sala puede unirse y escribir disponibilidad. Pensado para equipos pequeños que confían entre sí, no para uso público sensible.
- El calendario usa una semana recurrente (lunes a domingo, 8:00–21:00), no fechas de un calendario específico.
