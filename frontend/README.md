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
npm run lint        # ESLint (Next core-web-vitals + TypeScript rules)
npm run format      # Prettier write
npm run format:check
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
| `/employees`       | `src/app/(dashboard)/employees/page.tsx`     | `HR_MANAGER` |
| `/employees/new`   | `src/app/(dashboard)/employees/new/page.tsx` | `HR_MANAGER` |
| `/employees/[id]`  | `src/app/(dashboard)/employees/[id]/page.tsx` | `HR_MANAGER` |
| `/employees/[id]/edit` | `src/app/(dashboard)/employees/[id]/edit/page.tsx` | `HR_MANAGER` |

Route groups `(auth)` and `(dashboard)` only select a layout; they do not appear in URLs.

### Employee directory URL parameters

The directory keeps its filters in the URL, so reloads, bookmarks and shared links keep the same view. Defaults are omitted. Multi-select filters repeat the key, e.g. `?country=IN&country=US`.

| Param        | Meaning | Default |
| ------------ | ------- | ------- |
| `q`          | Search by name, email or employee ID (debounced 300 ms) | — |
| `country`    | One or more ISO 3166-1 alpha-2 country codes | all countries |
| `department` | One or more department names | all departments |
| `status`     | One or more of `active`, `deleted`; `all` = every status | `active` |

The list loads 25 employees at a time and fetches the next batch as you scroll near the end (a "Load more" button does the same for keyboard users). Scroll position is not kept in the URL.

### Route protection

1. `src/proxy.ts` (Next.js Proxy, formerly middleware) runs for `/dashboard/*` and `/employees/*`: with no access-token cookie it redirects to `/login`, or — if a "Keep me signed in" refresh token exists — rotates tokens via `POST /auth/refresh` and continues.
2. `getCurrentUser()` (`src/features/auth/server/session.ts`) is the authoritative check: it validates the token with `GET /auth/verify` on the server and redirects to `/login` if the session is missing, invalid, inactive or not an allowed role. Both the dashboard layout and page call it (deduplicated per request). Employee pages call `requireRole(["HR_MANAGER"])`, which also sends other roles to `/dashboard`.
3. In the browser, any API call that returns 401 (expired session) redirects to `/login` (`src/app/providers.tsx`).

## Project structure

```
src/
  app/                      # routing only: layouts, pages, error boundary, providers
  components/ui/            # shadcn/ui primitives (+ Badge)
  components/form/          # shared form pieces (FormAlert, SubmitButton, SelectField)
  components/               # shared UI: PageHeader, SearchInput, MultiSelectFilter,
                            #   ConfirmDialog, EmptyState, QueryError
  features/auth/            # api.ts, hooks.ts, schemas.ts, types.ts, routes.ts, components/, server/
  features/dashboard/       # navigation config (role-based), shell, sidebar, user menu
  features/employees/       # api.ts, hooks.ts (TanStack Query), list-params.ts (URL state),
                            #   schemas.ts (form), types.ts, routes.ts, components/
  hooks/                    # useDebouncedCallback, useSearchParamsState, useInfiniteScroll, useIsMobile
  lib/                      # api-client, api-url, format (dates, country names, names),
                            #   search-params (typed URL param helpers)
  proxy.ts                  # optimistic route protection
  test/                     # test setup and helpers
```
