# Product Discovery: Employee Salary Management System

> **Status:** Reviewed. Decisions recorded in §8 (2026-11-22). Discovery only: no database design, stack choice or implementation yet.
> **Source:** "Assessment with Product Framing" brief (ACME org salary management).
> **Next step:** Confirm the follow-ups in §10, then condense this into the one-page requirements document the brief asks for.

### How to read this document

Every point is tagged so it's clear where it comes from:

| Tag | Meaning |
|---|---|
| **[Stated]** | Written in the assessment brief |
| **[Inferred]** | Not written, but follows directly from what is stated |
| **[Assumption]** | Something I'm treating as true that needs your confirmation |
| **[Recommendation]** | A product or engineering judgment call I propose, with the trade-off explained |

---

## 1. Business problem and current pain points

### 1.1 Problem statement

- **[Stated]** ACME's HR team manages salary data for **10,000 employees** across **multiple countries**.
- **[Stated]** Everything is managed in Excel, which is described as "tedious".
- **[Stated]** The goal is a web-based tool where the HR Manager can (a) **manage** salary data and (b) **answer questions about how the org pays people**.

The brief names two jobs: **record-keeping** (manage) and **insight** (answer questions). Most of the product value is in the second. A CRUD screen alone replaces a spreadsheet without improving on it.

### 1.2 Pain points

The brief only says "tedious". These are the usual reasons a 10,000-row, multi-country spreadsheet becomes painful. All are **[Inferred]**:

| # | Pain point | Why it matters |
|---|---|---|
| P1 | **No single source of truth.** Copies get emailed, versions diverge. | Decisions get made on stale or conflicting numbers. |
| P2 | **No validation.** Free-text cells allow typos, negative or missing salaries, and inconsistent job titles or country names. | Aggregates such as averages by role are quietly wrong. |
| P3 | **Slow to answer pay questions.** Every question ("what's the average salary for engineers in India?") needs manual pivots and filters. | Answers are slow, error-prone and hard to repeat. |
| P4 | **Multi-currency confusion.** Salaries in different currencies sit side by side in one column. | Cross-country comparisons are easy to get wrong. |
| P5 | **No access control or audit trail.** Anyone holding the file sees everything, and nobody knows who changed what. | Salary data is highly sensitive, which creates compliance and trust risk. |
| P6 | **Doesn't scale with the workload.** Searching, sorting and editing across 10k rows is clumsy. | HR spends its time on data handling instead of analysis. |

---

## 2. User persona

### 2.1 Primary persona: HR Manager **[Stated]**

| Attribute | Description |
|---|---|
| **Role** | HR Manager at ACME, responsible for compensation data across all countries |
| **Technical comfort** **[Assumption]** | Comfortable with Excel (filters, pivots); not a SQL or BI user |
| **Data scope** **[Assumption]** | Sees and edits **all** employees in **all** countries; no per-region restriction |
| **Frequency** **[Assumption]** | Uses the tool daily or weekly for edits, and in bursts for analysis (review cycles, leadership questions) |

### 2.2 Responsibilities **[Inferred]**

1. Keep employee and salary records accurate: onboarding new hires, recording raises and promotions, handling exits.
2. Find a specific employee's compensation quickly.
3. Answer pay questions from leadership, finance or auditors, e.g.:
   - "What do we pay on average in country X?"
   - "What's the salary range for job title Y in country X?"
   - "How many people do we have per country / per role?"
4. Spot anomalies such as outliers, possible pay inconsistencies and data errors.

### 2.3 Personas out of scope **[Recommendation]**

Employees (self-service), line managers, Finance and Payroll operators are **not** users of the MVP. The brief names a single persona. Adding more would bring role-based permissions, approval workflows and different UIs, which multiplies scope without adding to the assessed core.

---

## 3. Product goals and success criteria

### 3.1 Goals

| ID | Goal | Source |
|---|---|---|
| G1 | Replace Excel as the system of record for employee salary data | [Stated] |
| G2 | Let the HR Manager answer common "how do we pay people" questions without manual spreadsheet work | [Stated] |
| G3 | Keep the data trustworthy through validation that stops bad data at the point of entry | [Inferred] |
| G4 | Perform well at 10,000 employees | [Stated] scale, [Inferred] goal |
| G5 | Ship as deployed, working, tested software with visible engineering reasoning | [Stated] |

### 3.2 Measurable success criteria **[Recommendation]**

The brief defines no metrics. These are proposed targets that can be checked on the deployed app with the 10k seed data:

| Goal | Success criterion | How to verify |
|---|---|---|
| G1 | The HR Manager can create, view, update and remove an employee entirely in the UI | Manual demo plus end-to-end tests of each flow |
| G1 / G4 | Finding a specific employee by name takes **≤ 2 interactions** (type in search, click result) | Demo walkthrough |
| G2 | Each standard insight (§5, F3) is visible in **≤ 2 clicks** from the home screen | Demo walkthrough |
| G2 | Insight figures **exactly match** independently computed values on the seed data | Automated tests against a known fixture |
| G3 | **0** invalid records can be saved (every validation rule in §7 has a rejection test) | Unit tests |
| G4 | Paginated list, search and insight responses at 10k records return in **< 500 ms (p95)** on the deployed environment | Simple timing check, documented in performance notes |
| G4 | Seeding 10k employees finishes in **< 30 s** and is **deterministic** (same input gives same data) | Seed script run, timed |
| G5 | Core domain logic (validation, aggregation) is covered by fast, deterministic unit tests | Test report |

**Trade-off:** These targets are deliberately modest. 10,000 rows is small for a relational database, so the bar is "feels instant to a human", not high-throughput engineering. Setting tighter targets would push effort into optimization the user wouldn't notice.

---

## 4. Core user journeys

| ID | Journey | Trigger | Steps (happy path) | Outcome |
|---|---|---|---|---|
| **J1** | **Find an employee** | "What does Priya earn?" | Open employee list → search by name → open record | Sees role, country, salary, currency |
| **J2** | **Browse and filter the workforce** | Reviewing a team or region | Open list → filter by country and/or job title → sort by salary | Narrowed, sorted list across 10k records, paginated |
| **J3** | **Add a new hire** | Offer accepted | Click "Add employee" → fill form → validation feedback → save | New record shows up in the list and insights |
| **J4** | **Update compensation** | Raise, promotion or transfer | Open employee → edit salary, title or country → save | Record updated; previous salary kept in history; insights reflect the change. If someone else saved the record meanwhile, the save is rejected with a clear "record changed, reload" message. |
| **J4b** | **Review salary history** | "When did Priya last get a raise?" | Open employee → view salary history | Chronological list of past salaries, with when each changed and who changed it |
| **J5** | **Remove an employee** | Exit or data error | Open employee → delete → confirm (warns that this is permanent) | Record and its salary history are gone; no longer in list or insights |
| **J6** | **Answer a pay question** | Leadership asks "what do we pay people in Germany?" | Open insights → see per-country min / max / average and headcount | Answer in seconds, no spreadsheet |
| **J7** *(candidate)* | **Compare across the org** | "Where do we spend the most on salaries?" | Open insights → org-wide view by country | Headcount and salary summary per country |

J1, J3, J4 and J5 cover **manage**. J2, J6 and J7 cover **answer questions**. J6 is the journey that best demonstrates product value and should get the most polish.

---

## 5. Feature breakdown

### F1. Employee records (CRUD) **[Stated: "manage the salaries data"]**
- Create, view, update and delete an employee.
- Fields **[Decided, Q3]**: employee ID, full name, email, job title (free text), department, country, currency, salary.
- Salary is entered as a single annual amount; a monthly breakdown (annual ÷ 12) is shown alongside it **[Decided, Q4, see §10]**.
- Form validation with clear inline error messages.
- **Concurrency protection [Decided, Q10]:** saving a record that someone else changed since you opened it is rejected, not silently overwritten.

### F1b. Salary history **[Decided, Q6]**
- Every salary change is kept: previous amount, new amount, currency, when, and by whom.
- Viewable on the employee record.
- Deleting an employee permanently removes the employee **and** their history.

### F1c. Authentication **[Decided, Q1]**
- HR users sign in before seeing any data. MVP has one role (HR Manager) with full access.
- Designed for role-based access later: every user carries a role and every action goes through one permission check, so new roles can be added without reworking existing features.

### F2. Employee directory **[Inferred from 10k scale]**
- Paginated list (10k rows can't be rendered in one go).
- Search by name.
- Filter by country and job title.
- Sort by name and by salary.
- Empty state and "no results" state.

### F3. Salary insights **[Stated: "answer questions about how the org pays people"]**
MVP insight scope **[Decided, Q7]**:
- **Per country:** minimum, maximum and average salary, plus headcount, each in the country's local currency.
- No cross-country totals or averages, because there is no currency conversion (Q2).
- Per-job-title stats and median are **not** in the MVP.

### F4. Seed data **[Stated]**
- Script that generates 10,000 realistic employees across several countries and job titles.
- **[Recommendation]** Deterministic (seeded randomness) and idempotent (safe to re-run), with realistic salary ranges per country and role so the insights mean something.

### F5. Deployment and demo **[Stated]**
- Publicly reachable deployed instance.
- Recorded video walkthrough.

### F6. Engineering artifacts **[Stated]**
- One-page requirements document, design notes, trade-offs, AI prompts used, performance notes.
- Incremental commit history.
- Meaningful, fast, deterministic unit tests.

---

## 6. MVP vs future enhancements

### 6.1 MVP (must have)

| Feature | Reason it's in |
|---|---|
| F1 Employee CRUD with validation and concurrency protection | Directly stated ("manage salaries data"); concurrency decided (Q10) |
| F1b Salary history | Decided (Q6) |
| F1c Login, single HR role, RBAC-ready | Decided (Q1) |
| F2 Paginated list with search, filter and sort | Basic usability at 10k scale |
| F3 Per-country min / max / avg and headcount | Directly stated ("answer questions"); the core value |
| F4 Deterministic 10k seed | Directly stated |
| F5 Deployment and video | Directly stated |
| Unit tests on domain logic | Directly stated |

### 6.2 Should have if time permits **[Recommendation]**

| Feature | Value | Why not MVP |
|---|---|---|
| Median and percentile bands in insights | More honest view of pay distribution | Nice refinement; average plus min / max already answers the stated need |
| Per-job-title stats within a country | Answers "what do we pay engineers in X?" | Excluded by Q7; harder with free-text titles (Q5) |
| Org-wide headcount overview (J7, headcount only) | Fast executive summary | Builds on F3; can come last |
| CSV export of a filtered list | Familiar for Excel users; eases the transition | Low effort, but not core |

### 6.3 Future enhancements (deliberately out)

| Feature | Reason for leaving it out |
|---|---|
| **Bulk Excel / CSV import** | Valuable for migration, but brings messy-data handling (mapping, partial failures, duplicates). The seed script covers the data need for the assessment. |
| **Currency conversion (static or live)** | Decided out (Q2). Needs rate sources and dates, and risks misleading comparisons. |
| **Role-based access control and multi-persona** | Only one persona is stated. **Planned next:** the MVP is built so roles can be added without rework (F1c). |
| **Approval workflows** (manager proposes, HR approves raises) | Workflow engine scope; not requested. |
| **Payroll** (tax, deductions, payslips) | A different product. Salary *management* ≠ payroll *processing*. |
| **Compensation bands, compa-ratio, pay equity / gender gap analysis** | High value, but needs extra data (levels, demographics) and careful handling of sensitive attributes. |
| **Natural-language questions ("ask your data")** | Interesting AI feature, but adds correctness and security risk. Structured insights answer the stated need reliably. |
| **Employee self-service, notifications, integrations (HRIS, SSO)** | Different personas or enterprise scope. |

**Key trade-off:** The MVP is shaped to do **"manage + answer questions" well**, rather than cover a wide surface thinly. The brief says it values "good engineering judgment" over "the most complex system", and a smaller, well-tested, polished core is more convincing than a broad, fragile one.

---

## 7. Business rules, validations, edge cases and security

### 7.1 Business rules **[Assumption / Recommendation]**

| ID | Rule | Note |
|---|---|---|
| BR1 | Every employee belongs to exactly **one country** | Needed for per-country insights |
| BR2 | Every salary has a **currency**; salaries are stored and shown in that currency | Multi-country implies multi-currency (Q2) |
| BR3 | Salary is **one stored amount: annual gross base pay**; monthly = annual ÷ 12, derived for display only | Single source of truth, no monthly-vs-annual mismatch (Q4, interpretation to confirm in §10) |
| BR4 | Money is held with **exact precision**, never floating-point approximations | Avoids rounding drift in totals and averages |
| BR5 | Insights include only **current** employees | Deleted employees are gone entirely (Q6), so they can't skew stats |
| BR6 | Each country has a **default currency**; the salary currency must match it unless overridden | Stops "INR salary in a US employee" errors (Q2) |
| BR7 | Job title is **free text**, trimmed of extra whitespace | Decided (Q5). Fine because MVP insights are per country, not per title. |
| BR8 | Every salary change **adds a history entry** (old → new, when, by whom); history is never edited | Trustworthy record of pay changes (Q6) |
| BR9 | A save based on an **outdated copy** of a record is rejected | Prevents lost updates between HR users (Q10) |
| BR10 | Only signed-in users with permission can read or change data; all checks go through one permission layer | Login now, roles later (Q1) |

### 7.2 Validations **[Recommendation]**

| Field | Validation |
|---|---|
| Full name | Required; trimmed; reasonable max length; Unicode allowed (international names) |
| Job title | Required; free text; trimmed; reasonable max length (Q5) |
| Department | Required; free text; trimmed; reasonable max length |
| Country | Required; from a fixed list (ISO country codes) |
| Currency | Required; valid ISO currency code; consistent with country (BR6) |
| Salary | Required; numeric; **> 0**; max 2 decimal places; upper sanity bound to catch typos (extra zeros) |
| Employee ID / email *(if included)* | Unique across the org; format-checked |
| All inputs | Validated on the **server** (authoritative), mirrored in the UI for fast feedback |

### 7.3 Edge cases

| Edge case | Expected behavior **[Recommendation]** |
|---|---|
| Country with **one** employee | Stats still compute (min = max = avg). Flag the privacy issue: the "average" is that person's salary (see security). |
| Same title typed differently ("SWE" vs "Software Engineer") | Treated as different titles. Acceptable since MVP has no per-title stats; title filter/search is case-insensitive. |
| Salary edit that **doesn't change** the amount | No history entry is created |
| Employee **deleted** | Their salary history is deleted with them; confirmation dialog says so |
| Filter or search with **no results** | Clear empty state, not an error |
| Insight for a country with **no employees** | Show "no data", never divide by zero |
| **Concurrent edits** (two HR users edit the same record) | Second save is rejected with "this record was changed by someone else; reload to see the latest" (Q10). No silent overwrite. |
| Editing an employee that was **deleted** meanwhile | Save fails with a clear "employee no longer exists" message |
| Employee **changes country** | Currency must be revisited; insights move them to the new country |
| **Very large or tiny** salaries (e.g. extra zero typed) | Rejected by the sanity bound, or warned about |
| **Duplicate employee** (same name) | Allowed: names aren't unique. A unique ID or email decides identity. |
| Name with **accents or non-Latin script** | Stored and searched correctly |
| **Pagination while data changes** | Stable sort order so rows don't skip or repeat |
| **Skewed distributions** | Averages mislead; show min / max (and median if included) next to them |
| **Delete by mistake** | Confirmation dialog stating it is permanent. No undo (hard delete decided, Q6). |

### 7.4 Security and privacy requirements

Salary data is among the most sensitive data an organization holds. The brief says nothing about security, but a **publicly deployed** app holding salary data makes it an unavoidable topic.

| ID | Requirement | Classification |
|---|---|---|
| S1 | **Access control:** only signed-in HR users can view or modify data; one role in MVP, RBAC-ready | [Decided] Q1 |
| S1b | **Credentials:** passwords stored only as strong one-way hashes; sessions expire; demo credentials not hard-coded in the UI | [Recommendation] |
| S2 | **HTTPS only** in the deployed environment | [Recommendation] |
| S3 | **Server-side validation** and parameterized data access (no injection) | [Recommendation] baseline |
| S4 | **No salary or PII in URLs, logs or error messages** | [Recommendation] |
| S5 | **Seed data is synthetic.** No real people's data. | [Inferred] |
| S6 | **Secrets** (credentials, keys) kept out of the repository | [Recommendation] |
| S7 | **Small-group disclosure:** aggregates over very small groups reveal individual pay | [Recommendation] note it; MVP shows them, since the HR Manager can see individuals anyway |
| S8 | **Audit trail** of salary changes (who, when, old → new) | [Decided] Q6, via salary history. Lost when an employee is deleted. |
| S9 | Data protection (GDPR-style rights, retention) | [Assumption] out of scope for the assessment; documented as a known gap |

---

## 8. Decision log

The product owner made these decisions on 2026-11-22. Each row records the question, the decision and what follows from it.

> **Superseded during SRS review (2026-11-22).** Q4: the stored amount is **monthly**. Q5: job title (and department) are chosen **from lists**. Q6: employees are **soft-deleted** and their history is kept. Q1: an **Admin** role manages HR user accounts. Q7: per-country statistics are **split by currency**, since an employee's currency can differ from their country's. See [requirements.md §11.1](requirements.md) for the current decisions.

| # | Question | Decision | Consequence |
|---|---|---|---|
| **Q1** | Authentication | **Login in MVP; no RBAC yet, but designed for it.** | One HR Manager role with full access. Every user has a role and every action passes one permission check, so roles can be added later without reworking features. |
| **Q2** | Currency | **Store salary in local currency. No conversion.** | Insights are per country only. No org-wide salary totals or averages, since they would mix currencies. Conversion moves to future scope. |
| **Q3** | Employee fields | **Employee ID, full name, email, job title, department, country, currency, salary.** | Employee ID and email are unique. Employment type and hire date are not in the MVP. |
| **Q4** | Salary definition | **One stored amount, with a monthly breakdown.** | Interpreted as: store the annual gross base salary once, and show monthly = annual ÷ 12 as a derived value. *Interpretation to confirm, see §10.* |
| **Q5** | Job titles | **Free text.** | Flexible for HR. Inconsistent spellings are possible, which is acceptable because the MVP has no per-title stats. Search and filter on title are case-insensitive. |
| **Q6** | History and delete | **Keep salary history; delete employees permanently.** | Each salary change records old → new, when, and who. Deleting an employee also deletes their history (see §10). |
| **Q7** | Insight scope | **Per country: min / max / average salary and headcount.** | Per-title stats and median are out of the MVP. |
| **Q8** | Excel import | **Out of MVP.** | Documented in §6.3 as future scope. |
| **Q9** | Seed data | **10,000 employees.** | Number of countries not specified. Working assumption: ~6–10 countries with realistic local salary ranges (see §10). |
| **Q10** | Concurrency | **Handle concurrent edits.** | Saving a record that changed since it was opened is rejected with a clear message instead of silently overwriting the other change (optimistic concurrency). |

---

## 9. Risks

### 9.1 Product risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Misleading cross-currency numbers** | HR or leadership make decisions on wrong comparisons | Insights strictly per country in local currency; no cross-country salary figures (Q2) |
| **Leadership asks for org-wide pay totals** | The MVP can't answer without conversion | State the limitation in the UI and docs; conversion is the first candidate enhancement (Q2) |
| **Insights don't answer real questions** | Product becomes "just CRUD", missing the stated value | Standard questions defined explicitly (Q7); J6 is the polished centerpiece |
| **Bad data skews insights** | Loss of trust in the tool | Strict validation (§7.2); country and currency from fixed lists |
| **Free-text job titles drift** ("SWE", "Software Eng.") | Title filters miss people; future per-title stats would need cleanup | Trimming and case-insensitive matching now; a title list or normalization when per-title stats are added (Q5) |
| **Permanent delete loses salary history** | The audit trail for that person is gone | Clear confirmation dialog; revisit if compliance needs retention (§10) |
| **Sensitive data exposed on a public URL** | Serious reputational issue, even for a demo | Login required (Q1); synthetic data only |
| **Scope creep** (import, FX, RBAC, AI query) | Core features end up shallow or under-tested | Clear MVP line (§6), "deliberately left out" list with reasons |
| **Averages hide skew** | Misread pay fairness | Show min / max next to the average; median as a stretch goal |

### 9.2 Technical risks

| Risk | Impact | Mitigation (no stack decided yet) |
|---|---|---|
| **Data persistence on the hosting platform.** Some hosts have ephemeral filesystems. | A file-based database could be wiped on redeploy, and the demo loses data | Weigh this when choosing database and host; seed on startup if empty as a fallback |
| **Monetary precision errors** | Wrong totals and averages | Exact decimal or integer minor-unit handling (BR4), with tests |
| **Unpaginated queries or rendering at 10k rows** | Slow UI and API | Server-side pagination, filtering and aggregation from day one |
| **Aggregation correctness** | Wrong answers erode trust | Unit tests against small hand-computed fixtures |
| **Non-deterministic seed or tests** | Flaky tests, demos you can't reproduce | Seeded randomness; tests use their own fixtures, not the 10k seed |
| **Single-currency assumptions baked in early** | Painful refactor when conversion is added | Currency stored with every salary from day one (Q2) |
| **Lost updates between HR users** | One user's change silently overwrites another's | Optimistic concurrency check on every update, with tests (Q10) |
| **Authorization bolted on later** | RBAC requires touching every feature | Single permission check point from the start (Q1) |
| **History and current salary drift apart** | History says one thing, the record says another | Salary change and its history entry saved together, all or nothing (Q6) |
| **Time box** | Unfinished deployment or demo | Deploy early (walking skeleton), then add features incrementally |

---

## 10. Remaining follow-ups

All ten questions are decided. Three points need a quick confirmation because my reading of the decision may not match your intent:

1. **Q4 monthly breakdown.** I've assumed we store **one annual gross amount** and show **monthly = annual ÷ 12** next to it. The alternative is to store the monthly amount and derive the annual figure. Which is the stored amount?
2. **Q6 history on delete.** Permanently deleting an employee also removes their salary history. That fits "delete permanently", but it means the audit trail for deleted employees is lost. Is that OK for the MVP?
3. **Q9 countries.** The seed has 10,000 employees. I'll spread them across **~6–10 countries** with realistic local salary ranges unless you want a specific list.

Once these are confirmed, the next artifact is the **one-page requirements document** the brief requires (goal, scope and features, deliberate exclusions and reasoning), condensed from this discovery document.
