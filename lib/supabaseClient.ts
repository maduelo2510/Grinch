import { createClient } from '@supabase/supabase-js';

// NOTA: En producción, usa variables de entorno (process.env.REACT_APP_SUPABASE_URL)
const supabaseUrl = 'https://lekfftdzknryjxlpvqtr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla2ZmdGR6a25yeWp4bHB2cXRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMDM1MjgsImV4cCI6MjA4MjU3OTUyOH0.GhpfySTCeArrFi_ogdSt-RN4E7MqnknV0qZMpNw7Ehc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);