import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types'

const supabaseUrl = 'https://hdpeshqjijdsrhjyvfza.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcGVzaHFqaWpkc3Joanl2ZnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMzQ1NjcsImV4cCI6MjA3MDgxMDU2N30.VkwFtfm-wF3zvbeoaNq3SfN3QBGD6xntRgWIXq9Yru8'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
