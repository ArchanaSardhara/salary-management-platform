import 'dotenv/config';
import { randomUUID } from 'crypto';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import type { PayFrequency, CompensationType } from '../src/generated/prisma/enums.js';

// ---------------------------------------------------------------------------
// Constants mirrored from employee.constants.ts (seed cannot import app src)
// ---------------------------------------------------------------------------

const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Customer Support',
  'Finance',
  'Human Resources',
  'Operations',
  'Legal',
] as const;

const DEPT_TITLES: Record<string, string[]> = {
  Engineering: ['Software Engineer', 'Senior Software Engineer', 'Engineering Manager'],
  Product: ['Product Manager'],
  Design: ['Product Designer'],
  Marketing: ['Marketing Specialist'],
  Sales: ['Sales Representative', 'Account Manager'],
  'Customer Support': ['Support Specialist'],
  Finance: ['Accountant', 'Financial Analyst'],
  'Human Resources': ['HR Specialist', 'HR Manager'],
  Operations: ['Operations Manager'],
  Legal: ['Legal Counsel'],
};

const SALARY_RANGES: Record<string, [number, number]> = {
  'Software Engineer': [70000, 120000],
  'Senior Software Engineer': [100000, 160000],
  'Engineering Manager': [130000, 180000],
  'Product Manager': [90000, 140000],
  'Product Designer': [80000, 120000],
  'Data Analyst': [65000, 100000],
  'Marketing Specialist': [50000, 80000],
  'Sales Representative': [45000, 75000],
  'Account Manager': [55000, 85000],
  'Support Specialist': [40000, 65000],
  Accountant: [55000, 80000],
  'Financial Analyst': [70000, 110000],
  'HR Specialist': [50000, 75000],
  'HR Manager': [70000, 100000],
  'Operations Manager': [75000, 110000],
  'Legal Counsel': [95000, 150000],
};

const COUNTRIES = [
  { code: 'US', currency: 'USD' },
  { code: 'GB', currency: 'GBP' },
  { code: 'CA', currency: 'CAD' },
  { code: 'AU', currency: 'AUD' },
  { code: 'DE', currency: 'EUR' },
  { code: 'FR', currency: 'EUR' },
  { code: 'IN', currency: 'INR' },
  { code: 'SG', currency: 'SGD' },
  { code: 'JP', currency: 'JPY' },
  { code: 'BR', currency: 'BRL' },
  { code: 'NL', currency: 'EUR' },
  { code: 'SE', currency: 'SEK' },
  { code: 'MX', currency: 'MXN' },
  { code: 'ZA', currency: 'ZAR' },
  { code: 'AE', currency: 'AED' },
];

const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Lisa', 'Daniel', 'Nancy',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Dorothy', 'Paul', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna',
  'Kenneth', 'Michelle', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa',
  'Timothy', 'Deborah', 'Ronald', 'Stephanie', 'Edward', 'Rebecca', 'Jason', 'Sharon',
  'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy',
  'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Anna', 'Stephen', 'Brenda',
  'Larry', 'Pamela', 'Justin', 'Emma', 'Scott', 'Nicole', 'Brandon', 'Helen',
  'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Raymond', 'Christine', 'Gregory', 'Debra',
  'Frank', 'Rachel', 'Alexander', 'Carolyn', 'Patrick', 'Janet', 'Jack', 'Catherine',
  'Dennis', 'Maria', 'Jerry', 'Heather', 'Tyler', 'Diane', 'Aaron', 'Julie',
  'Jose', 'Joyce', 'Adam', 'Victoria', 'Nathan', 'Kelly', 'Henry', 'Christina',
  'Douglas', 'Ruth', 'Zachary', 'Joan', 'Peter', 'Evelyn', 'Kyle', 'Judith',
  'Ethan', 'Andrea', 'Walter', 'Hannah', 'Noah', 'Megan', 'Jeremy', 'Cheryl',
  'Christian', 'Jacqueline', 'Keith', 'Martha', 'Roger', 'Madison', 'Terry', 'Teresa',
  'Gerald', 'Gloria', 'Harold', 'Sara', 'Sean', 'Janice', 'Austin', 'Ann',
  'Carl', 'Kathryn', 'Arthur', 'Alice', 'Lawrence', 'Jean', 'Dylan', 'Frances',
  'Liam', 'Olivia', 'Aiden', 'Sophia', 'Lucas', 'Isabella', 'Mason', 'Mia',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
  'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
  'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey',
  'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza',
  'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers',
  'Long', 'Ross', 'Foster', 'Jimenez', 'Powell', 'Jenkins', 'Perry', 'Russell',
  'Sullivan', 'Bell', 'Coleman', 'Butler', 'Henderson', 'Barnes', 'Gonzales', 'Fisher',
  'Vasquez', 'Simmons', 'Romero', 'Jordan', 'Patterson', 'Alexander', 'Hamilton', 'Graham',
  'Reynolds', 'Griffin', 'Wallace', 'Moreno', 'West', 'Cole', 'Hayes', 'Bryant',
  'Sharma', 'Patel', 'Kumar', 'Singh', 'Tanaka', 'Yamamoto', 'Sato', 'Suzuki',
  'Mueller', 'Fischer', 'Weber', 'Wagner', 'Dupont', 'Bernard', 'Dubois', 'Laurent',
];

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function pick<T>(arr: readonly T[] | T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randInt(min: number, max: number, rng: () => number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Simple LCG seeded PRNG — deterministic, reproducible seed runs. */
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s, 1664525) + 1013904223;
    return (s >>> 0) / 0x100000000;
  };
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) throw new Error('DATABASE_URL is not set');

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  // Employees and their related records are always re-seeded.
  // Users, refresh tokens, and password reset tokens are intentionally preserved.
  console.log('Clearing employee data...');
  await prisma.auditLog.deleteMany();
  await prisma.compensationRecord.deleteMany();
  await prisma.employee.deleteMany();

  // -------------------------------------------------------------------------
  // Users — upsert so existing accounts survive repeated seed runs
  // -------------------------------------------------------------------------
  console.log('Upserting seed users...');
  const passwordHash = await argon2.hash('Password123!');
  const now = new Date('2026-11-25T12:00:00Z');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@acme.com',
      passwordHash,
      emailVerified: true,
      role: 'ADMIN',
      isActive: true,
      updatedAt: now,
    },
  });

  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@acme.com' },
    update: {},
    create: {
      firstName: 'HR',
      lastName: 'Manager',
      email: 'hr@acme.com',
      passwordHash,
      emailVerified: true,
      role: 'HR_MANAGER',
      isActive: true,
      updatedAt: now,
    },
  });

  const userIds = [adminUser.id, hrUser.id] as const;

  // -------------------------------------------------------------------------
  // Employees
  // -------------------------------------------------------------------------
  const TOTAL_EMPLOYEES = 10_000;
  const TERMINATED_COUNT = 500;   // first 500 are terminated (soft-deleted)
  const NO_EMAIL_COUNT = 200;     // next 200 have no email address

  const FIVE_YEARS_AGO = new Date('2021-11-25T00:00:00Z');
  const SPAN_MS = now.getTime() - FIVE_YEARS_AGO.getTime();

  console.log(`Building ${TOTAL_EMPLOYEES.toLocaleString()} employee records...`);

  type EmployeeRow = {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
    countryCode: string;
    department: string;
    jobTitle: string;
    startDate: Date;
    endDate: Date | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    version: number;
  };

  const employees: EmployeeRow[] = [];
  const usedEmails = new Set<string>();

  for (let i = 0; i < TOTAL_EMPLOYEES; i++) {
    const rng = seededRng(i * 31_337 + 7);
    const firstName = pick(FIRST_NAMES, rng);
    const lastName = rng() > 0.02 ? pick(LAST_NAMES, rng) : null; // ~2% mononymous
    const department = pick(DEPARTMENTS as unknown as string[], rng);
    const jobTitle = pick(DEPT_TITLES[department], rng);
    const country = pick(COUNTRIES, rng);

    const isTerminated = i < TERMINATED_COUNT;
    const hasNoEmail = !isTerminated && i < TERMINATED_COUNT + NO_EMAIL_COUNT;

    const startDate = new Date(FIVE_YEARS_AGO.getTime() + Math.floor(rng() * SPAN_MS));
    startDate.setHours(0, 0, 0, 0);

    let endDate: Date | null = null;
    let deletedAt: Date | null = null;

    if (isTerminated) {
      const monthsAgo = randInt(1, 18, rng);
      endDate = addDays(addMonths(now, -monthsAgo), 0);
      endDate.setHours(0, 0, 0, 0);
      // Clamp: endDate must be after startDate
      if (endDate <= startDate) endDate = addDays(startDate, 90);
      deletedAt = addDays(endDate, 1);
    }

    let email: string | null = null;
    if (!hasNoEmail) {
      const base = `${firstName.toLowerCase()}.${(lastName ?? firstName).toLowerCase()}`;
      let candidate = `${base}${i}@acme.com`;
      while (usedEmails.has(candidate)) {
        candidate = `${base}${i}_${randInt(1, 9999, rng)}@acme.com`;
      }
      usedEmails.add(candidate);
      email = candidate;
    }

    const createdAt = addDays(startDate, randInt(0, 7, rng));

    employees.push({
      id: randomUUID(),
      firstName,
      lastName,
      email,
      countryCode: country.code,
      department,
      jobTitle,
      startDate,
      endDate,
      deletedAt,
      createdAt,
      updatedAt: createdAt,
      version: 1,
    });
  }

  const EMP_BATCH = 1000;
  for (let i = 0; i < employees.length; i += EMP_BATCH) {
    await prisma.employee.createMany({ data: employees.slice(i, i + EMP_BATCH) });
    process.stdout.write(`\r  Employees inserted: ${Math.min(i + EMP_BATCH, employees.length).toLocaleString()}/${TOTAL_EMPLOYEES.toLocaleString()}`);
  }
  console.log();

  // -------------------------------------------------------------------------
  // Compensation records + audit logs
  //
  // Rules:
  //   - Every employee gets at least one BASE_SALARY record.
  //   - Employees 0–1999 get a historical record (ended) + a current one (raise).
  //   - Employees 500–799 (active, post-terminated) also get a BONUS record.
  //   - Terminated employees have effectiveTo set on their last BASE_SALARY.
  // -------------------------------------------------------------------------
  console.log('Building compensation records and audit logs...');

  type CompRow = {
    id: string;
    employeeId: string;
    amount: number;
    currencyCode: string;
    payFrequency: PayFrequency;
    type: CompensationType;
    changeReason: string | null;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };

  type AuditRow = {
    id: string;
    compensationRecordId: string;
    changedById: string | null;
    changedAt: Date;
    beforeValue?: object;
    afterValue: object;
  };

  const compRecords: CompRow[] = [];
  const auditRows: AuditRow[] = [];

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const rng = seededRng(i * 99_991 + 13);
    const country = COUNTRIES.find((c) => c.code === emp.countryCode)!;
    const [salMin, salMax] = SALARY_RANGES[emp.jobTitle] ?? [50_000, 100_000];
    const changedById = rng() > 0.2 ? pick(userIds, rng) : null;

    const hasHistory = i < 2000;
    const hasBonus = i >= 500 && i < 800;

    if (hasHistory) {
      // --- Historical BASE_SALARY (ended) ---
      const histAmount = randInt(salMin, Math.max(salMin + 1, salMax - 10_000), rng);
      const histFrom = new Date(emp.startDate);
      const histTo = addMonths(histFrom, randInt(6, 24, rng));
      histTo.setHours(0, 0, 0, 0);
      const histId = randomUUID();

      compRecords.push({
        id: histId,
        employeeId: emp.id,
        amount: histAmount,
        currencyCode: country.currency,
        payFrequency: 'MONTHLY',
        type: 'BASE_SALARY',
        changeReason: 'Initial hire',
        effectiveFrom: histFrom,
        effectiveTo: histTo,
        createdAt: emp.createdAt,
        updatedAt: emp.createdAt,
      });
      auditRows.push({
        id: randomUUID(),
        compensationRecordId: histId,
        changedById,
        changedAt: emp.createdAt,
        afterValue: {
          amount: histAmount.toFixed(2),
          currencyCode: country.currency,
          payFrequency: 'MONTHLY',
          type: 'BASE_SALARY',
          effectiveFrom: isoDate(histFrom),
          effectiveTo: isoDate(histTo),
        },
      });

      // --- Current BASE_SALARY (raise) ---
      const curFrom = addDays(histTo, 1);
      const curAmount = randInt(Math.min(histAmount + 5_000, salMax), salMax, rng);
      const curTo = emp.endDate ?? null;
      const curId = randomUUID();

      compRecords.push({
        id: curId,
        employeeId: emp.id,
        amount: curAmount,
        currencyCode: country.currency,
        payFrequency: 'MONTHLY',
        type: 'BASE_SALARY',
        changeReason: 'Annual performance review',
        effectiveFrom: curFrom,
        effectiveTo: curTo,
        createdAt: curFrom,
        updatedAt: curFrom,
      });
      auditRows.push({
        id: randomUUID(),
        compensationRecordId: curId,
        changedById,
        changedAt: curFrom,
        beforeValue: {
          amount: histAmount.toFixed(2),
          currencyCode: country.currency,
          payFrequency: 'MONTHLY',
          type: 'BASE_SALARY',
          effectiveFrom: isoDate(histFrom),
          effectiveTo: isoDate(histTo),
        },
        afterValue: {
          amount: curAmount.toFixed(2),
          currencyCode: country.currency,
          payFrequency: 'MONTHLY',
          type: 'BASE_SALARY',
          effectiveFrom: isoDate(curFrom),
        },
      });
    } else {
      // --- Single BASE_SALARY ---
      const amount = randInt(salMin, salMax, rng);
      const compId = randomUUID();

      compRecords.push({
        id: compId,
        employeeId: emp.id,
        amount,
        currencyCode: country.currency,
        payFrequency: 'MONTHLY',
        type: 'BASE_SALARY',
        changeReason: 'Initial hire',
        effectiveFrom: emp.startDate,
        effectiveTo: emp.endDate ?? null,
        createdAt: emp.createdAt,
        updatedAt: emp.createdAt,
      });
      auditRows.push({
        id: randomUUID(),
        compensationRecordId: compId,
        changedById,
        changedAt: emp.createdAt,
        afterValue: {
          amount: amount.toFixed(2),
          currencyCode: country.currency,
          payFrequency: 'MONTHLY',
          type: 'BASE_SALARY',
          effectiveFrom: isoDate(emp.startDate),
        },
      });
    }

    if (hasBonus) {
      const bonusYear = now.getFullYear();
      const bonusFrom = new Date(`${bonusYear}-01-01`);
      const bonusAmount = randInt(3_000, 20_000, rng);
      const bonusId = randomUUID();

      compRecords.push({
        id: bonusId,
        employeeId: emp.id,
        amount: bonusAmount,
        currencyCode: country.currency,
        payFrequency: 'ANNUAL',
        type: 'BONUS',
        changeReason: 'Annual performance bonus',
        effectiveFrom: bonusFrom,
        effectiveTo: null,
        createdAt: bonusFrom,
        updatedAt: bonusFrom,
      });
      auditRows.push({
        id: randomUUID(),
        compensationRecordId: bonusId,
        changedById,
        changedAt: bonusFrom,
        afterValue: {
          amount: bonusAmount.toFixed(2),
          currencyCode: country.currency,
          payFrequency: 'ANNUAL',
          type: 'BONUS',
          effectiveFrom: isoDate(bonusFrom),
        },
      });
    }
  }

  const COMP_BATCH = 1000;
  for (let i = 0; i < compRecords.length; i += COMP_BATCH) {
    await prisma.compensationRecord.createMany({ data: compRecords.slice(i, i + COMP_BATCH) });
    process.stdout.write(`\r  Compensation records: ${Math.min(i + COMP_BATCH, compRecords.length).toLocaleString()}/${compRecords.length.toLocaleString()}`);
  }
  console.log();

  for (let i = 0; i < auditRows.length; i += COMP_BATCH) {
    await prisma.auditLog.createMany({ data: auditRows.slice(i, i + COMP_BATCH) });
    process.stdout.write(`\r  Audit logs: ${Math.min(i + COMP_BATCH, auditRows.length).toLocaleString()}/${auditRows.length.toLocaleString()}`);
  }
  console.log();

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  const active = employees.filter((e) => !e.deletedAt).length;
  const terminated = employees.filter((e) => e.deletedAt).length;

  console.log('\nSeed complete.');
  console.log(`  Users            : 2`);
  console.log(`    admin@acme.com   (ADMIN)`);
  console.log(`    hr@acme.com      (HR_MANAGER)`);
  console.log(`    password         : Password123!`);
  console.log(`  Employees        : ${employees.length.toLocaleString()} (${active.toLocaleString()} active, ${terminated.toLocaleString()} terminated)`);
  console.log(`  Compensation recs: ${compRecords.length.toLocaleString()}`);
  console.log(`  Audit logs       : ${auditRows.length.toLocaleString()}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
