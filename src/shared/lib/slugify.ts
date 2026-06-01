// Convierte un título de vacante en un slug URL-amigable con sufijo aleatorio único.
// El slug se genera en cliente porque en el MVP la inserción ocurre desde el formulario
// del empleador; a gran escala se movería a un trigger Postgres para garantizar unicidad
// sin condición de carrera.
export function slugify(text: string): string {
  // 1. Minúsculas
  // 2. Quitar diacríticos: NFD separa el carácter base del acento; la regex elimina
  //    los combinadores (U+0300-U+036F). Ejemplo: é→e, á→a, ñ→n (la tilde queda
  //    suelta como combinador y se elimina).
  // 3. Reemplazar todo lo que no sea a-z / 0-9 por guion
  // 4. Recortar guiones extremos
  let slug = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  // 5. Truncar a 60 chars y eliminar guion colgante que pudiera quedar tras el corte
  slug = slug.slice(0, 60).replace(/-+$/, '')

  // 6. Sufijo aleatorio base36 de exactamente 5 chars.
  // Math.random().toString(36).slice(2, 7) produce 5 chars casi siempre, pero si
  // Math.random() devuelve 0 la cadena es "0" y slice(2,7) quedaría vacía.
  // El bucle garantiza exactamente 5 chars en cualquier caso.
  let suffix = ''
  while (suffix.length < 5) {
    suffix = (suffix + Math.random().toString(36).slice(2)).slice(0, 5)
  }

  return `${slug}-${suffix}`
}
