import { createClient } from '@supabase/supabase-js'

// Paste yaha apni Supabase URL aur anon/public API key
const supabaseUrl = 'https://wfcduuyytadtzuvakvsb.supabase.co' // Replace with your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmY2R1dXl5dGFkdHp1dmFrdnNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTY2MjksImV4cCI6MjA3MzE3MjYyOX0.ylNJCLcW5jUBhTLQk6DE5mX0TRiyKtiSkO44q87A2hM' // Replace with anon/public key

export const supabase = createClient(supabaseUrl, supabaseKey)
