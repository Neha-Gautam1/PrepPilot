const FORBIDDEN_KEYWORDS = [
  'insert', 'update', 'delete', 'drop', 'alter', 'create', 'truncate',
  'grant', 'revoke', 'copy', 'call', 'execute', 'merge', 'vacuum',
  'pg_', 'information_schema', 'public.', 'pg_catalog',
];

export interface QueryValidationResult {
  ok: boolean;
  reason?: string;
}

export function validateReadOnlySelect(rawQuery: string): QueryValidationResult {
  const query = rawQuery.trim();

  if (query.length === 0) return { ok: false, reason: 'Query is empty' };
  if (query.length > 2000) return { ok: false, reason: 'Query is too long' };

  const withoutTrailingSemicolon = query.endsWith(';') ? query.slice(0, -1) : query;
  if (withoutTrailingSemicolon.includes(';')) {
    return { ok: false, reason: 'Only a single statement is allowed' };
  }

  if (query.includes('--') || query.includes('/*')) {
    return { ok: false, reason: 'Comments are not allowed in submitted queries' };
  }

  const lower = withoutTrailingSemicolon.toLowerCase();

  if (!lower.trimStart().startsWith('select')) {
    return { ok: false, reason: 'Only SELECT statements are allowed' };
  }

  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (lower.includes(keyword)) {
      return { ok: false, reason: `Query contains a disallowed keyword: "${keyword}"` };
    }
  }

  return { ok: true };
}