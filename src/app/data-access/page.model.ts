/** Cursor-paginated response used by every list endpoint. */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}