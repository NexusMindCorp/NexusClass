import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type {
  Database,
  NomeTabelaPublica,
  TabelaInsert,
  TabelaRow,
  TabelaUpdate,
} from "./database.types";

export const hasSupabaseConfig = Boolean(__URL_SUPABASE__ && __KEY_SUPABASE__);
export const supabase = createClient<Database>(__URL_SUPABASE__, __KEY_SUPABASE__);
