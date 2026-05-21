# Manga Reader

Private manga reader built as a `pnpm` monorepo with:

- a Vue 3 + Vite frontend
- a NestJS + Fastify backend
- PostgreSQL via Prisma
- S3-compatible image storage via MinIO

Public instance: [https://manga-reader.tuturu.io](https://manga-reader.tuturu.io)

## Repository structure

```text
apps/
  backend/    NestJS API
  frontend/   Vue SPA
packages/
  db/         Prisma + shared client
  scripts/    admin/import scripts
```

## Features

- JWT authentication
- manga listing
- chapter and page listing
- reading resume and read-chapter tracking
- manga import
- page storage in MinIO / S3
- Prometheus endpoint at `/api/metrics`

## Requirements

- Node.js 24 recommended
- `pnpm` 10
- Docker + Docker Compose

## Environment variables

The project expects a root `.env` file for local development.

Notes:

- the backend exposes the API under the `/api` prefix
- in development, Vite proxies `/api` to `http://localhost:${BACKEND_PORT}`
- `VITE_COOKIE_TOKEN_DURATION` is read by the frontend and validated by the backend

## Run locally

1. Install dependencies:

```bash
pnpm install
```

2. Start PostgreSQL and MinIO:

```bash
docker compose up -d
```

3. Generate and prepare the database:

```bash
pnpm db:generate
pnpm db:migrate
```

4. Start the application:

```bash
pnpm dev
```

Useful local URLs:

- frontend : <http://localhost:5173>
- backend : <http://localhost:3000/api>
- MinIO API : <http://localhost:9000>
- MinIO Console : <http://localhost:9001>

## Useful scripts

```bash
pnpm dev
pnpm lint

pnpm db:generate
pnpm db:build
pnpm db:migrate
pnpm db:deploy
pnpm db:reset

pnpm create:user -- <email> <password>
pnpm list:users

pnpm list:mangas
pnpm delete:manga -- <manga-name>
pnpm upload:manga-dir -- <directory>
```

## Import a manga

The `pnpm upload:manga-dir -- <directory>` script expects a directory structure like this:

```text
My Manga/
  Chapter 1/
    001.jpg
    002.jpg
  Chapter 2/
    001.jpg
    002.png
```

Current constraints:

- the root folder name becomes the manga name
- each chapter must be a directory
- each chapter name must contain a number
- only `.jpg`, `.jpeg`, and `.png` files are supported
- chapter directories must not contain nested subdirectories

## Production

The production Docker stack is defined in `docker-compose.prod.yml`:

- `postgres`
- `minio`
- `db` to prepare Prisma
- `backend` exposed locally on `127.0.0.1:4030`
- `frontend` exposed locally on `127.0.0.1:3030`

The frontend image does not reverse proxy `/api`. In production, an external reverse proxy must sit in front of the containers and route:

- `/` to the frontend
- `/api` to the backend

This is the expected setup for `manga-reader.tuturu.io`.

The `.env.docker` file must provide at least the variables used by PostgreSQL, the backend, and MinIO, especially:

- `PG_MANGA_READER_DB`
- `PG_MANGA_READER_USER`
- `PG_MANGA_READER_PASSWORD`
- `PG_URL`
- `JWT_SECRET`
- `COOKIE_SIGNATURE`
- `VITE_COOKIE_TOKEN_DURATION`
- `S3_ENDPOINT`
- `S3_PORT`
- `S3_USE_SSL`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `S3_BUCKET`
- `PORT`

## Main API

Useful routes:

- `POST /api/auth/login`
- `GET /api/mangas`
- `GET /api/mangas/:name`
- `POST /api/mangas/import`
- `DELETE /api/mangas/:name`
- `GET /api/chapters/:mangaName/:chapterNumber`
- `GET /api/pages/:id`
- `GET /api/pages/:id/minified`
- `GET /api/chapters-read`
- `POST /api/chapters-read`
- `DELETE /api/chapters-read/:id`
- `GET /api/user`
- `GET /api/user/list`
- `GET /api/metrics`
