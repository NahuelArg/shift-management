/* eslint-disable @typescript-eslint/no-unsafe-return */
export function convertBigIntToString<T = any>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value,
    ),
  ) as T;
}
