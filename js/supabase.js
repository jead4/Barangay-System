import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL  = 'https://rcqrgraxeyfqvqlthkxr.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcXJncmF4ZXlmcXZxbHRoa3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTI0ODAsImV4cCI6MjA5MzIyODQ4MH0.FqtpxIfyg-10xLb3_obV55_SXTBo9SCXvH5szpI6jcI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)