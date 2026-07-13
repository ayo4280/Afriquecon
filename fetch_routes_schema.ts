import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { resolve } from 'path';

const envContent = fs.readFileSync(resolve(process.cwd(), '.env'), 'utf-8');
let url = '';
let key = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=').slice(1).join('=').trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=').slice(1).join('=').trim();
}

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('routes').select('*').limit(1);
  if (error) {
    console.error("Error fetching routes:", error);
  } else {
    console.log("Sample route data (to infer schema):", JSON.stringify(data, null, 2));
  }
}

run();
