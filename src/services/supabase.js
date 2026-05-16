import { createClient } from '@supabase/supabase-js'

const cfg = window.__EXTRANET_CONFIG__ || {}

export const supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
