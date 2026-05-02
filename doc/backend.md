# Backend overview

Node.js **Express** API under `backend/`. JSON bodies are validated with **Zod**; persistence uses **Mongoose** (MongoDB). The HTTP layer follows **routes → controllers → services → repositories → models**.

## Base URL and auth

- Default local server port comes from env (see `backend/src/config/env.ts`).
- **CORS** allows credentials; the SPA sets `VITE_API_URL` and uses a shared Axios client (`frontend/src/api/client.ts`) with `withCredentials: true`.
- **JWT**: sent as `Authorization: Bearer <token>` (token in `localStorage`) and/or session cookies where applicable—see auth middleware in `backend/src/middleware/`.

## Architecture (request flow)

1. **Routes** (`backend/src/routes/*.routes.ts`) — mount paths, middleware (login, roles, upload, validation).
2. **Controllers** (`backend/src/controllers/`) — parse request, call services, shape HTTP responses.
3. **Services** (`backend/src/services/`) — business rules and orchestration.
4. **Repositories** (`backend/src/repositories/`) — query/aggregate Mongoose models.
5. **Models** (`backend/src/models/`) — Mongoose schemas.

Global middleware is wired in `backend/src/app.ts`: `cors`, JSON/urlencoded limits, static files, `cookie-parser`, login rate limiter, then route mounts, then `notFoundHandler` and `errorHandler`.

## API surface (mount prefixes)

| Prefix | Purpose |
|--------|---------|
| `/api/auth` | Registration, login, logout, profile, bootstrap |
| `/api/user` | User CRUD-adjacent ops (create, freeze, passwords, …) |
| `/api/transaction` | Credit / debit balance |
| `/api/news` | News CRUD (admin) |
| `/api/campaigns` | Create campaign, update campaign stats |
| `/api/dashboard` | Aggregated dashboard reads + Excel export |
| `/api/complaints` | Complaints CRUD |
| `/api/support` | Support form submission |

## Route inventory (37 handlers)

Counts below are **distinct HTTP route registrations** (method + path).

### `/api/auth` — 7

| Method | Path |
|--------|------|
| POST | `/register` |
| POST | `/login` |
| GET | `/bootstrap-status` |
| POST | `/bootstrap-admin` |
| POST | `/logout` |
| PUT | `/update-profile` |

### `/api/user` — 7

| Method | Path |
|--------|------|
| POST | `/create` |
| DELETE | `/delete/:userId` |
| PUT | `/freeze/:userId` |
| PUT | `/unfreeze/:userId` |
| PUT | `/update/:userId` |
| PUT | `/change-password/:userId` |
| PUT | `/change-own-password` |

### `/api/transaction` — 2

| Method | Path |
|--------|------|
| POST | `/credit` |
| POST | `/debit` |

### `/api/news` — 3

| Method | Path |
|--------|------|
| POST | `/create` |
| PUT | `/update/:newsId` |
| DELETE | `/delete/:newsId` |

### `/api/campaigns` — 2

| Method | Path |
|--------|------|
| POST | `/` |
| PUT | `/stats/:campaignId` |

### `/api/dashboard` — 12

| Method | Path |
|--------|------|
| GET | `/manage-business` |
| GET | `/home` |
| GET | `/transaction` |
| GET | `/news` |
| GET | `/complaints` |
| GET | `/manage-reseller` |
| GET | `/manage-user` |
| GET | `/tree-view` |
| GET | `/whatsapp-reports` |
| GET | `/export-campaign/:campaignId` |
| GET | `/all-campaigns` |
| GET | `/support` |

### `/api/complaints` — 3

| Method | Path |
|--------|------|
| POST | `/create` |
| DELETE | `/delete/:complaintId` |
| PUT | `/update/:complaintId` |

### `/api/support` — 1

| Method | Path |
|--------|------|
| POST | `/` |

## Frontend integration

The React app calls these endpoints via **Axios** (`api` instance), not raw `fetch`, for same-origin API traffic. **Binary exports** (e.g. Excel) use `responseType: 'blob'`. Downloading arbitrary **external image URLs** (e.g. CDN) may still use `fetch` in the browser when those URLs are not on the API origin.

## Configuration

See `backend/src/config/env.ts` for required environment variables (database URI, secrets, CORS origin, Cloudinary, etc.) and defaults.
