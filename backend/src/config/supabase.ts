import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

// Only create client if both URL and key are provided
const supabase = supabaseUrl && supabaseKey 
	? createClient(supabaseUrl, supabaseKey)
	: null;

export default supabase;
