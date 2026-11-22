# Employee Compensation Management - Requirements

#### Status: MVP proposal 
#### Primary user: HR Manager 
#### Scale: ~10,000 employees across multiple countries


# Goal and problem
ACME currently manages employee and salary information in spreadsheets. This creates fragmented records, manual updates, limited visibility, and makes organization-wide compensation questions difficult to answer.

Build a secure web application that centralizes employee and compensation records. HR Managers should be able to find employees, maintain salary history, and understand compensation distribution by country and department.

This is an Employee Compensation Management System, not a payroll-processing product.


# MVP scope
1. Authentication and access: HR Manager login/logout; backend-enforced access to protected employee and compensation data.
2. Employee directory: Search by employee code, name, or email; filter by country, department, status, and job title; server-side sorting and pagination; view employee profiles.
3. Compensation management: View current compensation; record a salary change with amount, ISO currency code, and effective date; preserve prior records; validate amounts and prevent overlapping effective periods.
4. Dashboard and reports: Show employee count and compensation statistics by country, department, and currency. Never add or average different currencies as if they were equivalent.
5. Auditability: Record who changed compensation, when, and the before/after values. Salary and audit writes must succeed or fail together.
6. Data and delivery: PostgreSQL database, reproducible seed script for 10,000 synthetic employees and initial compensation records, automated tests, deployed React UI and API, setup documentation, and demo video.

# Deliberately out of scope
- Payroll execution, tax, deductions, benefits, and payslips: These require country-specific rules and payroll integrations.
- Employee self-service: The assessment persona is the HR Manager.
- CSV/Excel import and bulk migration: Valuable later, but requires mapping, duplicate handling, validation, and error recovery. First establish reliable core records and workflows.
- Approval workflows, notifications, and multiple HR roles: Defer until ACME defines its policies and permission model.
- Automatic currency conversion and consolidated global totals: No reporting currency or exchange-rate policy has been specified; MVP reports remain grouped by currency.
- AI recommendations, benchmarking, microservices, Kafka, and Kubernetes: Not needed to demonstrate the stated use case at this scale.

# Assumptions and business rules
- Each employee has a unique employee code; email is unique where available.
- Compensation is stored as a decimal amount plus an ISO 4217 currency code, never as floating-point money.
- Salary changes are effective-dated and do not overwrite history. Previous periods are closed/superseded; future-dated changes can be represented.
- Effective-date boundaries and overlap rules are enforced consistently.
- Analytics are derived from persisted data and grouped by currency.
- Assessment data is synthetic; no real employee or salary information is used.

# Success criteria
- HR Manager can log in and access protected functionality.
- Seed process creates 10,000 employees and compensation records repeatably.
- Employee search, filters, and pagination work through the API.
- HR can view compensation history and record a valid salary change.
- Invalid amounts/currencies and overlapping periods are rejected.
- A failed audit write rolls back the salary change.
- Dashboard figures are database-derived and currency-safe.
- Core business rules and critical workflows have deterministic automated tests.
- Application is deployed with documented setup and a short walkthrough video.

#### Future roadmap
> Next: CSV import/export, advanced filters and reports, multiple HR roles, approval workflows, and notifications.

#### Later: 
> Employee self-service, SSO, compensation bands/benchmarking, governed FX conversion, payroll-provider integrations, and advanced compensation planning.

#### Open questions for production
> Define salary basis (annual/monthly/hourly and base/total), backdating policy, approval rules, authoritative employee data source, reporting currency/FX policy, country-level access restrictions, and data-retention requirements