# salary-management-platform
A centralized platform for HR managers to manage employee salary information and understand how the organization pays people.

## Prerequisites

- Node.js 24 (`nvm use` from the repo root reads `.nvmrc`)
- Independent installs: `frontend/` and `backend/` each have their own `package.json`

## Git hooks (repo root)

From the repository root, install Husky and lint-staged once:

```bash
npm install
```

After that, Git hooks run automatically:

- **pre-commit** — lint-staged: ESLint + Prettier on staged frontend files, oxlint + Prettier on staged backend files. Committing `.env` files is blocked (`.env.example` is allowed).
- **pre-push** — frontend `eslint` and `tsc --noEmit`; backend `oxlint` (without `--type-aware`), `tsc --noEmit`, and `prettier --check`.

See `frontend/README.md` and `backend/README.md` for per-package scripts.
