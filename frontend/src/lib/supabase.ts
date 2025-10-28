import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vezvrvwrgimtnivlimfi.supabase.co";
const supabaseAnonKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlenZydndyZ2ltdG5pdmxpbWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0NDY2NzQsImV4cCI6MjA0OTAyMjY3NH0.CUYNNuwS4zM0MxmGld402Fcj0VUqMavUI7TvVE_oTYs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
