// Supabase Configuration
// ✅ Supabase-Daten eingetragen!

const SUPABASE_URL = 'https://awfpgidutxrkfwgdjjpn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZnBnaWR1dHhya2Z3Z2RqanBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3ODE3MDksImV4cCI6MjA3NjM1NzcwOX0.X0Ng5emoTaRpEXVPcsu2nOBZ7q4WBX1zEc9krU8KzMY';

// 🔍 DEBUG MODE
// console.log('=== SUPABASE CONFIG DEBUG ===');
// console.log('URL:', SUPABASE_URL);
// console.log('API Key (first 20 chars):', SUPABASE_ANON_KEY.substring(0, 20) + '...');
// console.log('window.supabase available:', typeof window.supabase);

// Prüfe ob Werte gesetzt wurden
if (SUPABASE_URL.includes('DEIN-PROJECT-ID') || SUPABASE_ANON_KEY.includes('DEIN-ANON-KEY')) {
  // console.error('⚠️ SUPABASE CONFIG FEHLT!');
  // console.error('Bitte trage in supabase-config.js deine Supabase-Daten ein!');
  // console.error('Siehe: SUPABASE-SETUP.md');
}

// DNS Pre-Test
// console.log('🔍 Testing DNS resolution...');
fetch(SUPABASE_URL, { method: 'HEAD', mode: 'no-cors' })
  .then(() => { /* console.log('✅ DNS resolution successful') */ })
  .catch(err => { /* console.error('❌ DNS resolution failed:', err.message) */ });

// Initialisiere Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// console.log('✅ Supabase Client initialized:', SUPABASE_URL);
// console.log('Client object:', supabase);

// Export für andere Module
window.supabaseClient = supabase;
window.SUPABASE_URL = SUPABASE_URL;


