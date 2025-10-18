// Supabase Configuration
// ✅ Supabase-Daten eingetragen!

const SUPABASE_URL = 'https://awfpgidutxrkfwgdjjpn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZnBnaWR1dHhya2Z3Z2RqanBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3ODE3MDksImV4cCI6MjA3NjM1NzcwOX0.X0Ng5emoTaRpEXVPcsu2nOBZ7q4WBX1zEc9krU8KzMY';

// Prüfe ob Werte gesetzt wurden
if (SUPABASE_URL.includes('DEIN-PROJECT-ID') || SUPABASE_ANON_KEY.includes('DEIN-ANON-KEY')) {
  console.error('⚠️ SUPABASE CONFIG FEHLT!');
  console.error('Bitte trage in supabase-config.js deine Supabase-Daten ein!');
  console.error('Siehe: SUPABASE-SETUP.md');
}

// Initialisiere Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase Client initialized:', SUPABASE_URL);

// Export für andere Module
window.supabaseClient = supabase;
window.SUPABASE_URL = SUPABASE_URL;

