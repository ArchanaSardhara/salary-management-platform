# Project: Employee Salary Management

# Tech Stack

### Backend
- Node.js + NestJS + TypeScript + PostgreSQL + Prisma ORM


### Frontend
- Next.js (App Router) + TypeScript + TanStack Query + shadcn/ui + Tailwind CSS

### Testing
- Backend: Jest + Supertest
- Frontend: React Testing Library


# Project Structure

- frontend/ and backend/ are independent projects.
- Each project has its own package.json.
- Frontend uses Next.js, React, and the associated UI libraries.
- Backend contains NestJS APIs, business logic, Prisma ORM, database schema, and migrations.
- PostgreSQL is the primary database.
- Prisma schema and migrations must remain inside the backend.
- Shared documentation lives at the repository root and in docs/.


## Document rules

### product-discovery.md
- never edit scope silently. If something during the build reveals a gap or contradiction in scope, flag it to me in chat instead of rewriting the doc

### requirements.md
- never edit scope silently. If something during the build reveals a gap or contradiction in scope, flag it to me in chat instead of rewriting the doc

### README.md file rules 
- Update immediately whenever setup steps, scripts, or run instructions change.

### AI Usage Documentation Rules

Maintain `AI_USAGE.md` throughout the development lifecycle.

1. Every significant development task must have a corresponding numbered entry.
2. Document:
   - What was asked
   - What AI generated
   - Files changed
   - Technical decisions
   - Debugging and problem-solving
   - Test and verification results
3. Update AI_USAGE.md after completing each meaningful feature or development task.
4. Do not wait until the end of the project to update the log.
5. Never invent test results or claim that something was verified if it was not.
6. Clearly distinguish AI-generated work from developer decisions and modifications.
7. Preserve all existing entries. Never overwrite or remove historical records.
8. Keep a `[human note: ]` placeholder for developer reflection.
9. Do not write human notes on behalf of the developer. Ask the developer to fill them in.
10. Include AI_USAGE.md in the relevant documentation commit.

## Development Workflow

Follow this workflow for every feature:
- Read the relevant product discovery and requirements.
- Review the approved architecture.
- Identify dependencies and affected frontend/backend modules.
- Explain the proposed implementation before making significant architectural or scope changes.
- Implement the feature in small, logical steps.
- Follow existing project conventions and coding patterns.
- Write or update relevant tests.
- Execute the applicable test suites.
- Review the implementation for bugs, security issues, and edge cases.
- Update relevant documentation, including README.md and AI_USAGE.md when applicable.
- Summarize completed work, changed files, and verification results.

Do not silently skip steps that are relevant to the feature.

## Code Quality Rules

- Use TypeScript strict typing wherever practical.
- Avoid any unless there is a documented reason.
- Prefer reusable components and maintainable functions.
- Keep business logic separate from route handlers and UI components.
- Follow consistent naming conventions.
- Handle errors explicitly.
- Validate incoming API data.
- Avoid unnecessary dependencies.
- Avoid duplicate logic.
- Do not introduce unrelated refactoring.
- Do not leave unused code, debugging statements, or temporary workarounds.

## Database Guidelines

- PostgreSQL is the primary database.
- Prisma is the ORM and database access layer.
- Keep schema.prisma and migrations inside backend/.
- Use meaningful model and field names.
- Define appropriate relationships, constraints, and indexes.
- Use Prisma migrations for schema changes.
- Never modify the production database schema manually.
- Use transactions for related salary and payroll operations.
- Use Decimal types for monetary values where appropriate.
- Avoid floating-point arithmetic for financial calculations.
- Preserve historical payroll records and auditability.

## Backend Guidelines

- Follow NestJS architecture using modules, controllers, providers, and services.
- Use dependency injection appropriately.
- Keep business logic inside services rather than controllers.
- Use Prisma Client for database operations.
- Use DTOs and validation pipes to validate incoming requests.
- Use parameterized queries whenever raw SQL is necessary.
- Handle database errors and Prisma exceptions appropriately.
- Return consistent API response structures.
- Use appropriate HTTP status codes.
- Keep database schema changes managed through Prisma migrations.
- Use transactions for operations requiring atomicity.
- Never store passwords in plain text.
- Follow secure authentication, authorization, and input validation practices.
- Keep database access and business logic maintainable and testable.

## Frontend Guidelines

- Use Next.js App Router conventions for routing and layouts.
- Use React Server Components by default.
- Use Client Components only when browser APIs, state, or user interactions require them.
- Use TanStack Query for server-state fetching, caching, synchronization, and mutations where appropriate.
- Use shadcn/ui for reusable UI components.
- Use Tailwind CSS for styling.
- Keep API integration separate from presentation logic.
- Use reusable and composable React components.
- Handle loading, empty, success, and error states.
- Validate forms using an appropriate schema validation approach.
- Avoid unnecessary client-side rendering and re-renders.
- Follow responsive design and accessibility practices.
- Keep components focused and maintainable.
- Avoid duplicating server-state management between TanStack Query and local component state

## Security Guidelines

- Never expose secrets or environment variables to frontend code.
- Keep sensitive operations on the backend.
- Enforce authorization on the backend, not just in the UI.
- Validate and sanitize incoming data.
- Protect employee and salary information.
- Never log passwords, authentication tokens, or sensitive salary data.
- Use secure password hashing.
- Follow least-privilege access principles.


## Testing Guidelines

### Backend
- Write unit tests for business logic.
- Write integration tests for API endpoints using Supertest.
- Cover success cases, validation failures, and error scenarios.

### Frontend
- Test components using React Testing Library.
- Test user interactions and form validation.
- Cover loading, empty, success, and error states.

### General
- Run relevant tests after implementation.
- Run the complete applicable test suite before final delivery.
- Never modify tests simply to make incorrect implementation pass.
- Report failing tests honestly.
- Do not claim tests pass unless they have actually been executed successfully.

## Git and Change Management

- Do not overwrite existing developer changes.
- Do not discard or reset files without explicit approval.
- Avoid modifying unrelated files.
- Keep commits focused on logical changes.
- Include relevant documentation updates with implementation changes.
- Never commit secrets, credentials, or local database files containing sensitive data.
- Do not create commits or push changes unless explicitly requested.

## Scope and Decision Management

- Approved product discovery and requirements define the expected business behavior.
- Do not invent business rules.
- Do not silently expand or reduce functionality.
- Ask for clarification when a business decision is missing.
- Clearly communicate assumptions before proceeding.
- Obtain developer approval for scope changes and significant architectural decisions.

## Completion Criteria

A feature is considered complete only when applicable criteria are satisfied:
- Implementation matches approved requirements.
- Relevant tests are written or updated.
- Applicable tests have been executed.
- Error handling and edge cases are addressed.
- No unrelated changes are introduced.
- Relevant documentation is updated.
- AI_USAGE.md contains the appropriate development entry.
- Remaining limitations or known issues are reported.

## Communication Rules

At the end of each meaningful development task, provide:
- Summary of implementation.
- Important technical decisions.
- Files created or modified.
- Tests executed and actual results.
- Outstanding issues or limitations.
- Documentation updated.
- Any developer action or approval required.

Be transparent about incomplete work. Never claim completion without verification.