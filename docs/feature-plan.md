# Feature Plan
## ACME Employee Compensation Management System

| | |
|---|---|
| **Status** | Draft. Architecture-stage document, no code written yet. |
| **Source of truth** | [`requirements.md`](requirements.md) (committed, current). This plan adds no scope beyond it. |
| **Background** | [`product-discovery.md`](product-discovery.md) |
| **Note on scope history** | `product-discovery.md` §8 contains a note that some decisions were "superseded during SRS review", pointing at a `requirements.md §11.1` that no longer exists. A different, shorter `requirements.md` is now the committed, authoritative document, and the full SRS this note refers to survives only as an untracked `requirements-cc.md`. **This plan follows the current `requirements.md` only** — see "Flagged gaps" below for what that leaves open. The stale note in `product-discovery.md` is flagged, not edited. |

This document breaks `requirements.md`'s MVP scope into buildable feature groups with a build order, so implementation work (and incremental commits) has a concrete path to follow. It does not add business rules beyond what `requirements.md` states or directly implies.

---

## 1. Feature groups

Each group lists: what the HR Manager experiences, what the backend must provide, what the frontend must provide (mapped to shadcn/ui components already generated in `frontend/src/components/ui`), and what it depends on.

### F1. Authentication and access

- **User-facing:** HR Manager signs in; everything else is unreachable until then.
- **Backend:** credential check, session/token issuance, a guard applied to every other module's routes. `requirements.md` names one persona (HR Manager) and gives no role list beyond that — **no multi-role or Admin-account scope is assumed** (see Flagged gaps).
- **Frontend:** a sign-in route and form (`input.tsx`, `field.tsx`, `button.tsx`), a route guard/redirect for unauthenticated users, a signed-in shell (e.g. built on `sidebar.tsx` or `navigation-menu.tsx`) wrapping every other page.
- **Depends on:** nothing. Built first.

### F2. Employee directory

- **User-facing:** search by employee code, name or email; filter by country, department, status and job title; sort; paginate; open a profile.
- **Backend:** one query endpoint doing search/filter/sort/pagination server-side (per `requirements.md`'s explicit requirement — the client never does this client-side); authorization enforced the same way as every other endpoint.
- **Frontend:** a directory page (`table.tsx`, `pagination.tsx`, `input-group.tsx` for search, `select.tsx` for filters), empty/no-results states, loading/error states (TanStack Query).
- **Depends on:** F1.

### F3. Employee profile

- **User-facing:** view one employee's details and current compensation.
- **Backend:** a single-employee read endpoint.
- **Frontend:** a profile page/route, built from `card.tsx` and `separator.tsx`, linking to F4 (compensation) and F5 (history).
- **Depends on:** F1, F2 (navigated to from the directory).

### F4. Compensation management

- **User-facing:** view current compensation; record a salary change with amount, ISO currency code and an effective date; the system rejects invalid amounts/currencies and overlapping effective periods.
- **Backend:** a write endpoint that validates the amount and currency, checks for overlapping effective periods against existing records, and — in one transaction — writes the new compensation record **and** its audit entry together (`requirements.md`: "Salary and audit writes must succeed or fail together"). See the sequence diagram in `backend-architecture.md` §4.
- **Frontend:** a "record salary change" form (`dialog.tsx` or `drawer.tsx`, `input.tsx`, `select.tsx` for currency), inline validation errors, optimistic-update-safe mutation via TanStack Query (refetch on success, surfaced error on failure).
- **Depends on:** F1, F3.

### F5. Compensation history (part of auditability)

- **User-facing:** see prior compensation periods for an employee, not just the current one.
- **Backend:** a read endpoint returning an employee's compensation records in effective-date order; each record is immutable once written.
- **Frontend:** a history list/table on the profile page.
- **Depends on:** F3, F4 (there is nothing to show until a record exists).

### F6. Dashboard and reports

- **User-facing:** employee count and compensation statistics grouped by country, department and currency. **Figures in different currencies are never added or averaged together.**
- **Backend:** aggregation endpoint(s) computing counts and per-currency statistics (min/max/average) grouped by country and/or department; grouping by currency is structural, not optional, per `requirements.md`'s explicit rule.
- **Frontend:** a dashboard page (`card.tsx` for stat tiles, `table.tsx` or `tabs.tsx` for the grouped breakdown), with each statistic labeled with its currency.
- **Depends on:** F2–F4 (reads from the same data).

### F7. Auditability (cross-cutting)

- **User-facing:** for any compensation change, who changed it, when, and the before/after values are recorded (this shows up inside F5's history view; `requirements.md` does not call for a separate general-purpose audit screen).
- **Backend:** the audit write described in F4, always in the same transaction as the compensation write.
- **Frontend:** no dedicated screen beyond what F5 already shows.
- **Depends on:** F4.

### F8. Data and delivery

- **Backend:** Prisma schema and migrations; a reproducible seed script generating 10,000 synthetic employees with initial compensation records (and enough history/variety to exercise F5 and F6 meaningfully); automated tests (Jest + Supertest for the backend, React Testing Library for the frontend).
- **Delivery:** deployed API and UI, setup documentation (README, kept current per CLAUDE.md), `AI_USAGE.md` entries per completed feature, a short demo video.
- **Depends on:** runs alongside every other group — schema work precedes F1–F7; seed, tests and docs are completed per feature as it's built, not deferred to the end.

---

## 2. Build order

Proposed sequence, chosen so each phase produces something runnable and testable before the next begins, and so commits stay incremental and reviewable:

1. **Schema and seed skeleton** — Prisma models for Employee and CompensationRecord (and AuditLog, once F4's transaction design is settled in `backend-architecture.md`); a seed script that can create a small number of test employees before scaling to 10,000.
2. **F1 Authentication** — without it, nothing else can be demoed as "protected".
3. **F2 + F3 — Employee directory and profile (read paths)** — proves the query layer, pagination and the frontend shell end-to-end on real seeded data.
4. **F4 + F7 — Compensation write path with audit** — the highest-risk piece (transactional write, overlap validation); built and tested in isolation before reporting depends on its output.
5. **F5 — Compensation history** — thin read layer on top of F4's data.
6. **F6 — Dashboard and reports** — last, because it aggregates across everything built so far and benefits from a fuller seed dataset to look meaningful.
7. **Scale the seed to 10,000, polish, full test pass, deployment, README/AI_USAGE.md finalization, demo video.**

Each numbered step is a unit of incremental commits, per CLAUDE.md's development workflow (implement in small steps, write/run tests, update docs, before moving on).

---

## 3. Flagged gaps (not decided here)

`requirements.md` itself lists open questions for production; this plan carries them forward rather than resolving them, per CLAUDE.md ("ask for clarification when a business decision is missing", "do not invent business rules"):

| Gap | What `requirements.md` says | What this means for the build |
|---|---|---|
| **Salary basis** | Listed as an open question (annual/monthly/hourly; base/total) | Backend architecture stores amount + currency + effective dates in a basis-agnostic way (§3 of `backend-architecture.md`) so this can be settled without a schema rewrite. F4's form/validation will need the answer before it's finished. |
| **Backdating policy** | Open question | F4's overlap-validation rule needs this to be fully specified; assumed for now that effective dates can be past or future, with no further constraint, until told otherwise. |
| **Approval rules** | Explicitly out of scope ("Deliberately out of scope") | No approval step is built. |
| **Authoritative employee data source** | Open question | Assumed the seed script and this application's own writes are the only source for the MVP; no external HRIS integration is built. |
| **Reporting currency / FX policy** | Open question; "no reporting currency or exchange-rate policy has been specified; MVP reports remain grouped by currency" | F6 groups by currency rather than converting, as stated. |
| **Country-level access restrictions** | Open question | No per-country access scoping is built; any signed-in HR Manager sees all countries. |
| **Data-retention requirements** | Open question | No retention/erasure feature is built. |
| **Employee-code generation** | Not specified (requirements.md says "unique employee code" only) | Flagged for a decision before the Employee model is finalized (system-generated vs. supplied) — see `backend-architecture.md` §3. |
| **Whether there is more than one HR role** | `requirements.md` names a single persona, HR Manager, with no mention of an Admin or other role | F1 is built for one role. If a second role is needed later, the permission check is centralized (one guard/policy point) specifically so this doesn't require reworking every module. |

None of these block starting the build order in §2 — the schema and APIs are designed to accommodate an answer either way (see `backend-architecture.md` §6, "Explicitly flagged gaps").
