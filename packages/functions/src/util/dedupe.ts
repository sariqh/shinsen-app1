
type Key = string;
const windowMs = 120_000; // 120s time window

const mem = new Map<Key, number>();

export function makeKey(userId: string, resource: string, id: string | undefined, updatedAt: string | undefined) {
  return [userId, resource, id || "", updatedAt || ""].join("|");
}

export function seen(key: Key): boolean {
  const now = Date.now();
  const ts = mem.get(key);
  if (ts && now - ts < windowMs) return true;
  mem.set(key, now);
  // cleanup occasionally
  if (mem.size > 1000) {
    const cutoff = now - windowMs;
    for (const [k, t] of mem.entries()) if (t < cutoff) mem.delete(k);
  }
  return false;
}
