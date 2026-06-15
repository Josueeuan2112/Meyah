import type { LucideIcon } from 'lucide-react'
import { Briefcase, Clock, Eye, FileText, MessageSquare, Star } from 'lucide-react'

export interface StatItem {
  icon: LucideIcon
  value: string
  label: string
}

export function buildCandidatoStats(applicationsCount: number, responsesCount: number, hasCv: boolean, createdAt: string): StatItem[] {
  const months = Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / (30.44 * 24 * 60 * 60 * 1000)))
  return [
    { icon: FileText, value: String(applicationsCount), label: 'Postulaciones' },
    { icon: MessageSquare, value: String(responsesCount), label: 'Respuestas' },
    { icon: FileText, value: hasCv ? 'Cargado' : 'Pendiente', label: 'Currículum' },
    { icon: Clock, value: String(months), label: months === 1 ? 'Mes en Meyah' : 'Meses en Meyah' },
  ]
}

export function buildEmpleadorStats(activeJobs: number, totalApplications: number, totalViews: number, rating: number | null): StatItem[] {
  return [
    { icon: Briefcase, value: String(activeJobs), label: 'Vacantes activas' },
    { icon: FileText, value: String(totalApplications), label: 'Postulaciones' },
    { icon: Eye, value: totalViews.toLocaleString('es-MX'), label: 'Vistas totales' },
    { icon: Star, value: rating != null ? String(rating) : '—', label: 'Calif. empresa' },
  ]
}
