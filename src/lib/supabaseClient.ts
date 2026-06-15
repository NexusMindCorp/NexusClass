import { createClient } from "@supabase/supabase-js"
export const hasSupabaseConfig = Boolean(__URL_SUPABASE__ && __KEY_SUPABASE__)
export const supabase = createClient(__URL_SUPABASE__, __KEY_SUPABASE__)
