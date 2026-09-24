import { createClient } from '@supabase/supabase-js'

const fallbackUrl = 'https://nowlwprtcnieihelqjoa.supabase.co'
const fallbackKey = 'sb_publishable_487zTc09VarME-Fgf6EYig__47s_JTp'

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || fallbackUrl).trim()
export const SUPABASE_PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || fallbackKey).trim()
export const VELOURA_SCHEMA = 'veloura'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export function velouraDb() {
  return supabase.schema(VELOURA_SCHEMA)
}
