export type { Database } from './database.types'
import type { Tables, TablesInsert, TablesUpdate, Enums } from './database.types'

// ── Profiles ────────────────────────────────────────────────────────────────
export type Profile = Tables<'profiles'>
export type ProfileInsert = TablesInsert<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>

// ── Companies ───────────────────────────────────────────────────────────────
export type Company = Tables<'companies'>
export type CompanyInsert = TablesInsert<'companies'>
export type CompanyUpdate = TablesUpdate<'companies'>

// ── Jobs ────────────────────────────────────────────────────────────────────
export type Job = Tables<'jobs'>
export type JobInsert = TablesInsert<'jobs'>
export type JobUpdate = TablesUpdate<'jobs'>

// ── Applications ─────────────────────────────────────────────────────────────
export type Application = Tables<'applications'>
export type ApplicationInsert = TablesInsert<'applications'>
export type ApplicationUpdate = TablesUpdate<'applications'>

// ── Enums ────────────────────────────────────────────────────────────────────
export type UserType = Enums<'user_type'>             // 'empleador' | 'candidato'
export type JobStatus = Enums<'job_status'>           // 'abierta' | 'cerrada'
export type ApplicationStatus = Enums<'application_status'> // 'pendiente' | 'vista' | 'rechazada' | 'aceptada'
