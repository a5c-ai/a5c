export type JSONObject = Record<string, any>;

// Resolve a dot path like "a.b.c" from an object, returning undefined if missing
export function getByPath(obj: any, path: string): any {
  if (!path) return obj;
  const parts = path.split('.');
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

// Build a new object containing only the selected fields. Supports nested dot paths.
export function selectFields(obj: JSONObject, paths: string[]): JSONObject {
  if (!paths || paths.length === 0) return obj;
  const out: JSONObject = {};
  for (const raw of paths) {
    const path = String(raw).trim();
    if (!path) continue;
    const val = getByPath(obj, path);
    if (val === undefined) continue;
    // set nested structure on out
    const parts = path.split('.');
    let cur = out as any;
    for (let i = 0; i < parts.length; i++) {
      const k = parts[i];
      if (i === parts.length - 1) {
        cur[k] = val;
      } else {
        cur[k] = cur[k] ?? {};
        if (typeof cur[k] !== 'object') cur[k] = {};
        cur = cur[k];
      }
    }
  }
  return out;
}

export type FilterSpec = { path: string; value?: string };

// Parse filter expression of the form "a.b.c=value" or presence check "a.b.c"
export function parseFilter(expr?: string): FilterSpec | null {
  if (!expr) return null;
  const s = String(expr).trim();
  if (!s) return null;
  const eqIdx = s.indexOf('=');
  if (eqIdx === -1) return { path: s };
  return { path: s.slice(0, eqIdx), value: s.slice(eqIdx + 1) };
}

// Returns true if object passes filter: equals when value provided, otherwise presence/truthy
export function passesFilter(obj: JSONObject, filter: FilterSpec | null): boolean {
  if (!filter) return true;
  const got = getByPath(obj, filter.path);
  if (filter.value == null) return Boolean(got);
  // string compare; coerce to string for pragmatic CLI behavior
  return String(got) === filter.value;
}

