# Salary Management Platform — Frontend

Next.js 16 (App Router, Cache Components) + TypeScript + TanStack Query + shadcn/ui (Base UI) + Tailwind CSS 4.

## Prerequisites

- Node.js 20+
- The NestJS backend running (see `../backend`). The frontend expects it on `http://localhost:4000` by default.

## Configuration

| Variable  | Default                 | Purpose |
| --------- | ----------------------- | ------- |
| `API_URL` | `http://localhost:4000` | Base URL of the NestJS API. Server-only (never exposed to the browser). |

Set it in `frontend/.env.local` if your backend runs elsewhere:

```bash
API_URL=http://localhost:4000
```

`API_URL` is read by `next.config.ts` (the `/api/*` rewrite) at **build/start** time, so restart the dev server or rebuild after changing it.

### How the API is reached

- The browser calls same-origin `/api/*`; `next.config.ts` rewrites it to `${API_URL}/*`. This keeps the backend's httpOnly `access_token` / `refresh_token` cookies on the frontend origin — no CORS setup needed.
- Server Components call `${API_URL}` directly, forwarding the access-token cookie.

## Scripts

```bash
npm install
npm run dev         # development server on http://localhost:3000
npm run build       # production build (also runs the TypeScript check)
npm run start       # serve the production build
npm run lint        # ESLint
npm test            # Vitest + React Testing Library (single run)
npm run test:watch  # Vitest in watch mode
```

## Routes

| URL                | Route file                                   | Access |
| ------------------ | -------------------------------------------- | ------ |
| `/login`           | `src/app/(auth)/login/page.tsx`              | Public |
| `/register`        | `src/app/(auth)/register/page.tsx`           | Public |
| `/forgot-password` | `src/app/(auth)/forgot-password/page.tsx`    | Public |
| `/dashboard`       | `src/app/(dashboard)/dashboard/page.tsx`     | Signed-in `HR_MANAGER` / `ADMIN` |

Route groups `(auth)` and `(dashboard)` only select a layout; they do not appear in URLs.

### Route protection

1. `src/proxy.ts` (Next.js Proxy, formerly middleware) runs for `/dashboard/*`: with no access-token cookie it redirects to `/login`, or — if a "Keep me signed in" refresh token exists — rotates tokens via `POST /auth/refresh` and continues.
2. `getCurrentUser()` (`src/features/auth/server/session.ts`) is the authoritative check: it validates the token with `GET /auth/verify` on the server and redirects to `/login` if the session is missing, invalid, inactive or not an allowed role. Both the dashboard layout and page call it (deduplicated per request).

## Project structure

```
src/
  app/                      # routing only: layouts, pages, error boundary, providers
  components/ui/            # shadcn/ui primitives
  components/form/          # shared form pieces (FormAlert, SubmitButton)
  features/auth/            # api.ts, hooks.ts, schemas.ts, types.ts, routes.ts, components/, server/
  features/dashboard/       # navigation config (role-based), shell, sidebar, user menu
  lib/                      # api-client (browser fetch wrapper), api-url
  proxy.ts                  # optimistic route protection
  test/                     # test setup and helpers
```
