export function selectFields<T extends Record<string, any>>(
  obj: T,
  paths: string[],
): any {
  if (!paths || !paths.length) return obj;
  const out: any = {};
  for (const p of paths) {
    const segs = p.split(".");
    let src: any = obj;
    let dst: any = out;
    for (let i = 0; i < segs.length; i++) {
      const k = segs[i];
      if (src == null || typeof src !== "object" || !(k in src)) break;
      if (i === segs.length - 1) {
        dst[k] = src[k];
      } else {
        dst[k] = dst[k] || {};
        dst = dst[k];
        src = src[k];
      }
    }
  }
  return out;
}

export type FilterSpec = {
  path?: string;
  value?: string | number | boolean;
} | null;

export function parseFilter(expr?: string): FilterSpec {
  if (!expr) return null;
  const [path, value] = String(expr).split("=");
  if (!path) return null;
  if (value == null || value === "") return { path };
  const vLower = value.toLowerCase();
  const v =
    vLower === "true"
      ? true
      : vLower === "false"
        ? false
        : Number.isFinite(Number(value))
          ? Number(value)
          : value;
  return { path, value: v as any };
}

export function passesFilter(obj: any, spec: FilterSpec): boolean {
  if (!spec || !spec.path) return true;
  const segs = spec.path.split(".");
  let cur: any = obj;
  for (const k of segs) {
    if (cur == null || typeof cur !== "object" || !(k in cur)) return false;
    cur = cur[k];
  }
  if (!("value" in spec) || spec.value === undefined) return Boolean(cur);
  return cur === spec.value;
}
