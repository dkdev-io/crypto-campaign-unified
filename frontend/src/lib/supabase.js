import { createClient } from '@supabase/supabase-js'

// Use the main Supabase project that has the proper tables
const supabaseUrl = 'https://owjvgdzmmlrdtpjdxgka.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93anZnZHptbWxyZHRwamR4Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY4NTI4MTksImV4cCI6MjA0MjQyODgxOX0.dHyNtZfNzuaeBdrZiDzH4eMGYP4-FVWQd7F1Xf3VKz0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
