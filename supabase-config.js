// Supabase Configuration
// WICHTIG: Trage hier deine Supabase-Daten ein!

const SUPABASE_URL = 'https://DEIN-PROJECT-ID.supabase.co'; // 👈 HIER EINTRAGEN!
const SUPABASE_ANON_KEY = 'DEIN-ANON-KEY-HIER'; // 👈 HIER EINTRAGEN!

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

