import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zkauexnuvczpoebnlvij.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprYXVleG51dmN6cG9lYm5sdmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjE5ODMsImV4cCI6MjA3OTg5Nzk4M30.odPLyD9WWmED4_4_xYly98qASq0w_h95ldlDMyCSNkE';

export const supabase = createClient(supabaseUrl, supabaseKey);