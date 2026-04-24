# Problem 5 — A Crude Server

A CRUD REST API over an in-process SQLite database, built with ExpressJS +
TypeScript. The resource managed is a simple **task** (title, description,
status, priority, timestamps).

## Stack

| Concern    | Choice                                     | Why |
| ---------- | ------------------------------------------ | --- |
| Runtime    | Node 20 + TypeScript 5 (strict)            | Required by the task. |
| Framework  | **ExpressJS 4**                            | Required by the task. |
| Database   | **SQLite** via `better-sqlite3`            | File-based, zero-setup for the reviewer. Prebuilt binaries ship for Node 20 — no compilation required. Synchronous API fits Express handlers cleanly. |
| Validation | **Zod**                                    | Shared schema + TypeScript types, clear error reporting. |
| Runner     | **tsx**                                    | Runs TS directly, hot-reload via `tsx watch`, zero config. |

## Requirements

- Node.js **≥ 20**
- npm **≥ 10**

No Docker, no external services.

## Setup

```bash
cd src/problem5
cp .env.example .env        # optional — defaults work out of the box
npm install
```

The SQLite file is created automatically at `./data/tasks.db` on first
request (path configurable via `DB_PATH` env var, or `:memory:` for an
ephemeral DB).

## Running

```bash
npm run dev        # with auto-reload on file changes (tsx watch)
npm start          # one-shot start
npm run seed       # optional: wipe the DB and insert 8 sample tasks
npm run typecheck  # tsc --noEmit under strict mode
```

On success you will see:

```
Crude server listening on http://localhost:3000
  DB:    ./data/tasks.db
```

## Environment variables

| Name           | Default               | Notes |
| -------------- | --------------------- | ----- |
| `PORT`         | `3000`                | HTTP listen port. |
| `DB_PATH`      | `./data/tasks.db`     | SQLite file path. Use `:memory:` for in-memory DB. |
| `LOG_REQUESTS` | `true`                | Log every incoming request on one line. Set to `false` to silence. |

## Data model

A `task` is:

| Field         | Type                                     | Notes |
| ------------- | ---------------------------------------- | ----- |
| `id`          | integer, auto-increment                  | Primary key. |
| `title`       | string, 1..200                           | Required. |
| `description` | string, 0..2000, nullable                | Optional. |
| `status`      | `'pending' \| 'in_progress' \| 'done'`   | Defaults to `pending`. |
| `priority`    | `'low' \| 'medium' \| 'high'`            | Defaults to `medium`. |
| `createdAt`   | ISO 8601 UTC string                      | Set at creation. |
| `updatedAt`   | ISO 8601 UTC string                      | Touched on every `PATCH`. |

Enum values are enforced in two places: the Zod schema (rejects before the
DB is touched) and a SQLite `CHECK` constraint (defence in depth).

## Endpoints

Base URL: `http://localhost:3000`.

| Method   | Path              | Purpose                         |
| -------- | ----------------- | ------------------------------- |
| `GET`    | `/api/health`     | Liveness probe.                 |
| `POST`   | `/api/tasks`      | Create a task.                  |
| `GET`    | `/api/tasks`      | List with filters + pagination. |
| `GET`    | `/api/tasks/:id`  | Read one task.                  |
| `PATCH`  | `/api/tasks/:id`  | Partial update.                 |
| `DELETE` | `/api/tasks/:id`  | Delete a task.                  |

### Create — `POST /api/tasks`

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Ship Problem 5","priority":"high"}'
```

`201 Created`:

```json
{
  "id": 1,
  "title": "Ship Problem 5",
  "description": null,
  "status": "pending",
  "priority": "high",
  "createdAt": "2026-04-24T07:36:27.026Z",
  "updatedAt": "2026-04-24T07:36:27.026Z"
}
```

### List — `GET /api/tasks`

Query parameters (all optional):

| Param      | Type                                          | Default       |
| ---------- | --------------------------------------------- | ------------- |
| `status`   | `pending \| in_progress \| done`              | —             |
| `priority` | `low \| medium \| high`                       | —             |
| `q`        | substring search over `title` + `description` | —             |
| `page`     | positive int                                  | `1`           |
| `limit`    | int 1..100                                    | `20`          |
| `sort`     | `created_at \| -created_at \| updated_at \| -updated_at \| priority \| -priority` | `-created_at` |

```bash
# all tasks, newest first
curl 'http://localhost:3000/api/tasks'

# only pending, highest-priority first, paginated
curl 'http://localhost:3000/api/tasks?status=pending&sort=-priority&limit=10&page=1'

# substring search
curl 'http://localhost:3000/api/tasks?q=README'
```

Response envelope:

```json
{
  "data": [ /* tasks */ ],
  "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 },
  "filters":    { "status": null, "priority": null, "q": null, "sort": "-created_at" }
}
```

### Read one — `GET /api/tasks/:id`

```bash
curl http://localhost:3000/api/tasks/1
```

`404` if no such task.

### Update — `PATCH /api/tasks/:id`

Partial update — send only the fields you want to change.

```bash
curl -X PATCH http://localhost:3000/api/tasks/1 \
  -H 'Content-Type: application/json' \
  -d '{"status":"done"}'
```

`404` if the task doesn't exist. `400` if the body has no fields (enforced
by Zod so the server never issues a no-op `UPDATE`).

### Delete — `DELETE /api/tasks/:id`

```bash
curl -X DELETE http://localhost:3000/api/tasks/1 -i
# HTTP/1.1 204 No Content
```

`404` if the task doesn't exist.

## Error format

All non-2xx responses share one envelope:

```json
{
  "error": "ValidationError",
  "message": "Request failed validation",
  "issues": [ { "path": "status", "message": "Invalid enum value..." } ]
}
```

| Code  | When                                                |
| ----- | --------------------------------------------------- |
| `400` | Zod validation failed (body / params / query).      |
| `404` | Resource not found, or unknown route.               |
| `500` | Unexpected server error (logged in full server-side). |

## Project layout

```
src/problem5/
├── README.md           # you are here
├── package.json
├── tsconfig.json       # strict TS
├── .env.example        # copy to .env to override defaults
└── src/
    ├── index.ts        # entry point — load env, start listening
    ├── app.ts          # Express app factory (middleware wiring)
    ├── db.ts           # better-sqlite3 connection + schema bootstrap
    ├── errors.ts       # HttpError + central error handler
    ├── schemas.ts      # Zod schemas for create / update / list-query / :id
    ├── seed.ts         # `npm run seed` helper — sample data
    └── routes/
        └── tasks.ts    # 5 CRUD handlers + list filtering / pagination
```

## Design notes

- **Layering.** For a small CRUD the extra layering of
  controller/service/repository would be ceremony without payoff. Each
  route handler is short, reads its own query, and returns. Splitting
  happens when the logic stops fitting in a few lines.
- **Validation surface.** All request surface (body, query, `:id`) passes
  through Zod before anything touches the DB. Type assertions on the DB
  side (`as TaskRow`) are safe because the schema in `db.ts` pins the
  shape and values.
- **`RETURNING *`.** Used on `INSERT` and `UPDATE` so the handler returns
  the authoritative row (including server-computed timestamps) in one
  round-trip.
- **Parameterised queries only.** All user input reaches SQL through
  `better-sqlite3` bound parameters (`@name` or positional). No string
  interpolation, no SQL injection.
- **`WAL` mode.** Enabled in `db.ts` so reads don't block writes and vice
  versa — friendly to the dev-loop where `npm run dev` + curl happen
  simultaneously.
- **CORS.** Enabled with defaults because a frontend (Problem 2 or any
  other client) will typically run on a different origin during dev. Lock
  this down before production.
- **No auth.** Out of scope per the task description. In production this
  module would sit behind a JWT middleware — see Problem 6 for how that
  lands.
