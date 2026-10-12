import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rxinlaxexnezvagoaqtl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4aW5sYXhleG5lenZhZ29hcXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MjczOTUsImV4cCI6MjEwNzMwMzM5NX0.iCiysMVtFX2O1Z-8fwsZFNYnhNgn3MBZIfjITqjBWE8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
