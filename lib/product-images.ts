export function imageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((x): x is string => typeof x === "string").map(x => x.trim()).filter(x => {
    if (x.length > 2048) return false;
    if (/^\/api\/product-images\/[a-f0-9-]{36}$/.test(x)) return true;
    try { const u = new URL(x); return u.protocol === "https:" && !u.username && !u.password; } catch { return false; }
  }))).slice(0, 8);
}
