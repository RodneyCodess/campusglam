# Beauty Glam

Beauty Glam is a marketplace built for students to discover and offer beauty services on campus — hair, nails, lashes, makeup, and more — all in one place instead of scattered across Instagram DMs and word of mouth.

This repo is a monorepo with two apps:

- **`client/`** — React + TypeScript frontend (Vite)
- **`server/`** — Node.js + Express backend (TypeScript), with Postgres via Knex

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- [PostgreSQL](https://www.postgresql.org/) running locally (or a connection string to a remote instance)

## Local setup

### 1. Clone and install dependencies

```bash
git clone <this-repo-url>
cd beauty-glam

cd client && npm install
cd ../server && npm install
```

### 2. Configure environment variables

Each app has its own `.env.example`. Copy them to `.env` and fill in real values:

```bash
# from client/
cp .env.example .env

# from server/
cp .env.example .env
```

- `client/.env` — sets `VITE_API_BASE_URL`, the URL the frontend uses to reach the backend (defaults to `http://localhost:4000`).
- `server/.env` — sets `PORT` (defaults to `4000`) and `DATABASE_URL` (your local Postgres connection string).

### 3. Database setup

You need a Postgres database named `beauty_glam`. Pick one option:

**Option A: Postgres installed locally (port 5432).** Create the database with `createdb beauty_glam`. The default `DATABASE_URL` in `server/.env.example` already points to `localhost:5432`.

**Option B: Docker (port 5433).** Run:

```bash
docker run -d --name campusglam-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=beauty_glam \
  -p 5433:5432 \
  postgres:16
```

If your Postgres runs on any port other than 5432 (including Option B), change `DATABASE_URL` in your own `server/.env`, for example:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5433/beauty_glam
```

Then create the tables from `server/`:

```bash
cd server
npm install
npx knex migrate:latest
```

Run `npx knex migrate:latest` again whenever new migrations are added.

### 4. Run the backend

```bash
cd server
npm run dev
```

This starts the Express server at `http://localhost:4000`. Visit `http://localhost:4000/health` — you should see a JSON response like `{"status":"ok","timestamp":"..."}`.

### 5. Run the frontend

In a separate terminal:

```bash
cd client
npm run dev
```

This starts the Vite dev server (usually `http://localhost:5173`). Open it in your browser — the homepage calls the backend's `/health` endpoint and displays the result, confirming the two apps are connected.

## Linting and formatting

Both `client/` and `server/` have ESLint + Prettier configured:

```bash
npm run lint    # check for lint errors
npm run format  # auto-format with Prettier
```

## Project structure

```
beauty-glam/
├── client/               # React + TypeScript frontend (Vite)
│   └── src/
│       ├── api/          # Functions that call the backend
│       ├── components/   # Reusable UI pieces
│       ├── pages/        # Top-level page components
│       └── types/        # Shared TypeScript types
├── server/               # Express + TypeScript backend
│   ├── migrations/       # Knex database migrations
│   └── src/
│       ├── routes/       # Express route definitions
│       ├── controllers/  # Request handler logic
│       ├── middleware/   # Express middleware (error handling, etc.)
│       └── db/           # Database connection setup
└── README.md
```
