/**
 * The cursor is an opaque, base64-encoded pointer to "the last row the
 * client saw" — here, an ISO timestamp plus its id as a tiebreaker (two
 * rows can share the same created_at). Encoding it means the client never
 * has to understand or construct it; it just echoes back whatever
 * `nextCursor` it was given, exactly like an S3 continuation token.
 */
export interface Cursor {
  createdAt: string;
  id: string;
}

export function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString('base64url');
}

export function decodeCursor(raw: string | undefined): Cursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf-8'));
    if (typeof parsed.createdAt === 'string' && typeof parsed.id === 'string') return parsed;
    return null;
  } catch {
    return null; // malformed cursor from a stale/tampered client: treat as "start from the top"
  }
}