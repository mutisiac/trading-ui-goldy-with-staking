/** Normalize Express `req.params` values after validation middleware. */
export function pathParam(value: string | string[] | undefined): string {
  if (value === undefined) {
    return "";
  }
  return Array.isArray(value) ? value[0] ?? "" : value;
}
