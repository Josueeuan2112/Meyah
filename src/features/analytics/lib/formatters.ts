/** Format a number with Mexican Spanish locale (e.g. 1,234) */
export function fmtN(n: number): string {
  return Math.round(n).toLocaleString('es-MX')
}
