import { useRef } from 'react'
import { FileText, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { useUploadCV, useDeleteCV } from '@/features/profile/hooks/useCV'
import { Button } from '@/shared/ui/button'

interface CVUploadProps {
  cvPath: string | null
}

export default function CVUpload({ cvPath }: CVUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadCV = useUploadCV()
  const deleteCV = useDeleteCV()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    uploadCV.mutate(file, {
      onSuccess: () => toast.success('CV subido correctamente'),
      onError: (err) => toast.error(err.message),
    })

    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  const handleDelete = () => {
    deleteCV.mutate(undefined, {
      onSuccess: () => toast.success('CV eliminado'),
      onError: () => toast.error('No se pudo eliminar el CV'),
    })
  }

  return (
    <div className="rounded-card border border-meyah-border-soft bg-meyah-crema-50 p-4">
      <div className="flex items-center gap-2.5 mb-2.5">
        <FileText size={18} className="text-meyah-jade-700" />
        <span className="text-[13.5px] font-semibold text-meyah-tinta-900">Currículum (CV)</span>
      </div>

      {cvPath ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 border border-meyah-border-soft flex-1 min-w-0">
            <FileText size={16} className="flex-none text-meyah-jade-600" />
            <span className="truncate text-[13px] text-meyah-tinta-600">cv.pdf</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploadCV.isPending}
          >
            <Upload size={14} className="mr-1.5" />
            {uploadCV.isPending ? 'Subiendo…' : 'Cambiar'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={deleteCV.isPending}
            className="h-8 w-8 text-meyah-tinta-400 hover:text-meyah-terracota-500"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-meyah-border bg-white py-6 text-center">
          <Upload size={22} className="text-meyah-tinta-400" />
          <p className="text-[13px] text-meyah-tinta-600">
            Sube tu CV en formato PDF (máx. 5 MB)
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploadCV.isPending}
          >
            {uploadCV.isPending ? 'Subiendo…' : 'Seleccionar archivo'}
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      <p className="mt-2.5 text-[11.5px] text-meyah-tinta-400">
        Los empleadores solo pueden ver tu CV si te postulaste a una de sus vacantes.
      </p>
    </div>
  )
}
