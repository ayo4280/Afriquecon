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
  // Create table via RPC (we'll use direct insert since anon key can't DDL)
  // Insert agencies
  const agencies = [
    // Registered Address
    { country: 'Cameroon', city: 'Limbe/Buea', name: 'Registered Address', address: 'Middle Farms Limbe, P.B 144 Buea, Cameroon', phone: '+237 653237030', email: 'afriquecon@afriquecon.com' },

    // Cameroon Agencies
    { country: 'Cameroon', city: 'Yaounde', name: 'Yaounde Branch', address: 'Opposite Mansel Hotel, Quartier Fouda, Rte de Ngousso', phone: '+237 678197361', email: null },
    { country: 'Cameroon', city: 'Buea', name: 'Buea Branch', address: 'Before WDC mile 17', phone: '+678197346', email: null },
    { country: 'Cameroon', city: 'Douala', name: 'Douala Branch (Bessengue)', address: 'Carrefour Bessengue beside Tontana Hotel', phone: '+678197346', email: null },
    { country: 'Cameroon', city: 'Douala', name: 'Douala Branch (Camp Yabasi)', address: 'Opposite small Total, Camp Yabasi, Beside Unity Hall (seamans office)', phone: '+237 678197360', email: null },
    { country: 'Cameroon', city: 'Mamfe', name: 'Mamfe Branch', address: null, phone: null, email: null },

    // Nigeria Agencies
    { country: 'Nigeria', city: 'Abuja', name: 'Abuja Branch', address: 'EBOTRANS JABI UPSTAIRS OPPOSITE FCMB', phone: '+2348104292492', email: null },
    { country: 'Nigeria', city: 'Lagos', name: 'Lagos Branch', address: '118 TOTAL FILLING STATION MAZA MAZA BY OLD OJO ROAD', phone: '+2349029072330', email: null },
    { country: 'Nigeria', city: 'Ikom', name: 'Ikom Branch', address: 'Peace Mass Transit', phone: '+234 7061187679', email: 'support@afriquecon.com' },
    { country: 'Nigeria', city: 'Abakaliki', name: 'Abakaliki Branch', address: 'GUO Transport', phone: '07075604636', email: null },
    { country: 'Nigeria', city: 'Enugu', name: 'Enugu Branch', address: null, phone: null, email: null },
    { country: 'Nigeria', city: 'Onitsha', name: 'Onitsha Branch', address: 'Lagos park obgaru terminal - old Chisco park beside relivee market', phone: '+2347045337032 / +2348063644723', email: null },
  ];

  const { data, error } = await supabase.from('agencies').insert(agencies).select();
  if (error) {
    console.error("Insert Error:", JSON.stringify(error, null, 2));
  } else {
    console.log(`✅ Inserted ${data?.length} agencies successfully.`);
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
