const mxn = new Intl.NumberFormat('es-MX')

export function formatSalary(min: number | null, max: number | null): string {
  if (min != null && max != null) return `$${mxn.format(min)} – $${mxn.format(max)}`
  if (min != null) return `desde $${mxn.format(min)}`
  if (max != null) return `hasta $${mxn.format(max)}`
  return '—'
}
