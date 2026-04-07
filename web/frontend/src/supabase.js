import { createClient } from '@supabase/supabase-js'

// Jesli w .env bedzie brakowac, fallback zabezpieczony 
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rcsiagzrxwcvrvfmzrxg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjc2lhZ3pyeHdjdnJ2Zm16cnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTQ2MjUsImV4cCI6MjA4OTkzMDYyNX0.elAV1vuYJorVm6PwNZS4BmC6juCCyeCCp91co6tZuvI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
