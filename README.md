# InstaClone

InstaClone is a full-stack social-media application inspired by Instagram. It supports account registration and login, a feed, profiles and follows, post creation with local media uploads, stories, likes, notifications, messages, and live-video routes.

The web client is an Angular 18 application and the API is an Express/PostgreSQL service.

## Tech stack

| Area | Technology |
| --- | --- |
| Client | Angular 18, Signals, RxJS, SCSS |
| API | Node.js, Express, TypeScript |
| Database | PostgreSQL 16 |
| Authentication | JWT access tokens and rotating HTTP-only refresh cookies |
| Local media | Filesystem uploads with a production-ready two-step upload contract |
| Local database | Docker Compose |

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Docker Desktop with Docker Compose (recommended for PostgreSQL)

## Quick start

### 1. Install dependencies

From the project root:

```powershell
npm install
cd .\instaclone-api
npm install
cd ..
```

### 2. Configure the API

Copy the API environment template if `instaclone-api/.env` does not already exist:

```powershell
Copy-Item .\instaclone-api\.env.example .\instaclone-api\.env
```

For the included Docker database, use this development connection string in `instaclone-api/.env`:

```dotenv
DATABASE_URL="postgresql://instaclone:instaclone_dev_pw@localhost:5432/instaclone?schema=public"
```

The template contains development JWT secrets. Replace them with unique, long random values before deploying outside your local machine.

### 3. Start PostgreSQL

```powershell
docker compose up -d
```

The Compose configuration starts PostgreSQL 16 on `localhost:5432` with:

| Setting | Value |
| --- | --- |
| Database | `instaclone` |
| User | `instaclone` |
| Password | `instaclone_dev_pw` |

Check the container is ready:

```powershell
docker compose ps
```

### 4. Apply the schema

```powershell
cd .\instaclone-api
npm run db:migrate
cd ..
```

The migration is safe to re-run. It creates the schema and indexes when they do not exist.

### 5. Run the API and client

Use two terminals.

**Terminal 1 — API**

```powershell
cd D:\instaclone\instaclone-api
npm run dev
```

The API listens on `http://localhost:4001` by default. Verify it with:

```powershell
Invoke-WebRequest http://localhost:4001/healthz
```

**Terminal 2 — Angular client**

```powershell
cd D:\instaclone
npm start
```

Open `http://localhost:4200`. The Angular development server proxies `/api` calls to port `4001` through `proxy.conf.json`.

Create an account from the registration page, then log in with that account. Credentials are not provided or hard-coded in the client.

## Available scripts

### Client (`D:\instaclone`)

| Command | Description |
| --- | --- |
| `npm start` | Start the Angular development server with the API proxy |
| `npm run build` | Create an optimized production client build in `dist/` |
| `npm test` | Run Angular unit tests |

### API (`D:\instaclone\instaclone-api`)

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with file watching |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled API |
| `npm run db:migrate` | Apply `db/schema.sql` to PostgreSQL |

## Core routes

All API routes are prefixed with `/api`. Protected routes require a bearer access token. Authentication refresh uses an HTTP-only `refresh_token` cookie.

| Area | Routes |
| --- | --- |
| Health | `GET /healthz` |
| Authentication | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` |
| Feed and posts | `GET /feed`, `GET /posts/:postId`, `POST /posts`, `POST/DELETE /posts/:postId/like` |
| Profiles and follows | `GET /users/by-username/:username`, `GET /users/search`, `GET /users/:userId/posts`, `POST/DELETE /users/:username/follow` |
| Stories | `GET /stories/tray`, `POST /stories`, `POST /stories/seen` |
| Media | `POST /media/presign`, `PUT /media/upload/:key`, `GET /media/files/:key` |
| Notifications | `GET /notifications`, `POST /notifications/read-all` |

## Media uploads

During local development, uploaded files are written to `instaclone-api/uploads/` and exposed through `/api/media/files/`. This directory is ignored by Git. The client uses a two-step upload contract—request an upload URL, upload media, then create the post—so the storage implementation can later be replaced with S3, R2, or another object store without changing the UI workflow.

Supported upload types are JPG, PNG, WebP, GIF, MP4, and WebM. The local upload endpoint has a 25 MB request limit.

## Troubleshooting

### Registration or login returns `503`

PostgreSQL is not reachable. Start it with `docker compose up -d`, then run `npm run db:migrate` from `instaclone-api`. Confirm that `DATABASE_URL` in `instaclone-api/.env` matches the Docker credentials above.

### Port 5432 is already in use

Stop the conflicting PostgreSQL instance, or change both the Docker port mapping and `DATABASE_URL` to an available port.

### Port 4001 is already in use

Another API process is running. Stop it before starting a new one, or change `PORT` in `instaclone-api/.env` and update `proxy.conf.json` to match.

### Reset local database data

This removes the local Docker database volume:

```powershell
docker compose down -v
docker compose up -d
cd .\instaclone-api
npm run db:migrate
```

## Production notes

- Use strong unique JWT secrets and a managed PostgreSQL instance.
- Set `NODE_ENV=production`, `COOKIE_SECURE=true`, and a trusted `CORS_ORIGIN`.
- Put the API behind HTTPS and a reverse proxy.
- Replace local filesystem uploads with object storage and a CDN.
- Do not commit `.env`, `node_modules`, `dist`, or uploaded media.
