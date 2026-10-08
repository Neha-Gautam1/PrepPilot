import { prisma } from '../../lib/prisma';

const QUERY_TIMEOUT_MS = 3000;

export function normalizeRows(rows: unknown): unknown {
  const parsed = JSON.parse(JSON.stringify(rows));
  if (!Array.isArray(parsed)) return parsed;
  return parsed
    .map((row: any) => JSON.stringify(row))
    .sort()
    .map((s: string) => JSON.parse(s));
}

export async function executeSandboxQuery(query: string): Promise<unknown[]> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL search_path TO sandbox`);
    await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = ${QUERY_TIMEOUT_MS}`);
    return tx.$queryRawUnsafe(query) as Promise<unknown[]>;
  });
}