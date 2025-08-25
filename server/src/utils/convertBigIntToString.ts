export function convertBigIntToString(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  } else if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, typeof v === "bigint" ? Number(v) : convertBigIntToString(v)])
    );
  }
  return obj;
}