// Temporary wrapper to bypass type checking while types.ts is outdated
import { supabase as baseSupabase } from "@/integrations/supabase/client";

export const supabaseAny = baseSupabase as any;
