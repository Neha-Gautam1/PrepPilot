import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setUpSandboxSchema() {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS sandbox CASCADE;`);
  await prisma.$executeRawUnsafe(`CREATE SCHEMA sandbox;`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE sandbox.departments (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE sandbox.employees (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      department_id INTEGER REFERENCES sandbox.departments(id),
      salary INTEGER NOT NULL
    );
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO sandbox.departments (id, name) VALUES
      (1, 'Engineering'),
      (2, 'Sales');
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO sandbox.employees (id, name, department_id, salary) VALUES
      (1, 'Asha', 1, 90000),
      (2, 'Ravi', 1, 85000),
      (3, 'Meera', 2, 70000);
  `);
}

function normalizeRows(rows: unknown): unknown {
  const parsed = JSON.parse(JSON.stringify(rows));
  if (!Array.isArray(parsed)) return parsed;
  return parsed
    .map((row: any) => JSON.stringify(row))
    .sort()
    .map((s: string) => JSON.parse(s));
}

async function computeExpectedResult(query: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL search_path TO sandbox`);
    const rows = await tx.$queryRawUnsafe(query);
    return normalizeRows(rows);
  });
}

async function main() {
  await setUpSandboxSchema();

  const joinsTopic = await prisma.topic.findUniqueOrThrow({ where: { slug: 'sql-joins' } });

  const exercise1Query = `SELECT e.name, d.name AS department_name FROM employees e JOIN departments d ON e.department_id = d.id ORDER BY e.name`;
  const exercise1Expected = await computeExpectedResult(exercise1Query);

  const exercise2Query = `SELECT name FROM employees WHERE salary > 80000 ORDER BY name`;
  const exercise2Expected = await computeExpectedResult(exercise2Query);

  await prisma.sqlExercise.createMany({
    data: [
      {
        topicId: joinsTopic.id,
        prompt: 'List each employee name along with their department name.',
        canonicalQuery: exercise1Query,
        expectedResultJson: exercise1Expected as any,
        difficulty: 'MEDIUM',
      },
      {
        topicId: joinsTopic.id,
        prompt: 'List the names of employees earning more than 80000.',
        canonicalQuery: exercise2Query,
        expectedResultJson: exercise2Expected as any,
        difficulty: 'EASY',
      },
    ],
  });

  console.log('Sandbox schema + SQL exercises seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });