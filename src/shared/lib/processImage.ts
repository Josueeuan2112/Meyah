// Procesamiento de imágenes 100% en el cliente con canvas nativo (sin libs):
// valida → decodifica → center-crop cuadrado (object-fit cover) → exporta WebP.
// Mantiene el peso y las dimensiones controladas antes de subir a Storage.

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB

/**
 * Convierte un archivo de imagen a un Blob WebP cuadrado de `size`×`size`.
 *
 * Valida tipo y tamaño ANTES de procesar (lanza Error con mensaje en español).
 * El recorte es center-crop automático con matemática object-fit COVER: la
 * imagen se escala para cubrir el cuadro y se centra, sin deformar.
 *
 * Follow-up: el crop interactivo (reposicionar/zoom) puede agregarse luego con
 * react-easy-crop; hoy es center-crop automático, suficiente para avatar/logo.
 */
// size por defecto = 256: avatares/logos se muestran a 28–104 px, así que 256
// sigue siendo nítido a 2x DPR (104 px → 208 px) y pesa ~la mitad que 512.
export async function processImageToWebp(file: File, size = 256): Promise<Blob> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Solo se permiten imágenes JPG, PNG o WebP.')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('La imagen no puede superar 2 MB.')
  }

  // imageOrientation 'from-image': honra el flag EXIF. Sin esto, las fotos de
  // celular (orientación en metadatos) se dibujarían rotadas 90° en el canvas.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('No se pudo procesar la imagen.')
  }

  // object-fit COVER: escala por el lado MENOR para cubrir el cuadro, y centra
  // el recorte. scale = size / min(w, h) → la imagen siempre tapa el canvas.
  const scale = size / Math.min(bitmap.width, bitmap.height)
  const drawW = bitmap.width * scale
  const drawH = bitmap.height * scale
  const dx = (size - drawW) / 2
  const dy = (size - drawH) / 2

  ctx.drawImage(bitmap, dx, dy, drawW, drawH)
  bitmap.close()

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob)
        else reject(new Error('No se pudo procesar la imagen.'))
      },
      'image/webp',
      0.85,
    )
  })
}
