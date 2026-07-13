const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://hniimfwovqqjfdwoixae.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuaWltZndvdnFxamZkd29peGFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjc1NTM0NywiZXhwIjoyMDk4MzMxMzQ3fQ.EI0PEkdKKrFwU89x4SlT0Ei3w-Ga3y_hChni923w90k'
);

async function run() {
  const routesData = [
    { origin: "Lagos", destination: "Yaounde", base_rate_fcfa: 95000, active: true },
    { origin: "Lagos", destination: "Douala", base_rate_fcfa: 90000, active: true },
    { origin: "Lagos", destination: "Buea", base_rate_fcfa: 90000, active: true },
    { origin: "Lagos", destination: "Kumba", base_rate_fcfa: 85000, active: true },
    { origin: "Lagos", destination: "Mamfe", base_rate_fcfa: 60000, active: true },
    { origin: "Abuja", destination: "Yaounde", base_rate_fcfa: 100000, active: true },
    { origin: "Abuja", destination: "Douala", base_rate_fcfa: 90000, active: true },
    { origin: "Abuja", destination: "Buea", base_rate_fcfa: 90000, active: true },
    { origin: "Abuja", destination: "Kumba", base_rate_fcfa: 85000, active: true },
    { origin: "Abuja", destination: "Mamfe", base_rate_fcfa: 65000, active: true },
    { origin: "Abakaliki", destination: "Yaounde", base_rate_fcfa: 65000, active: true },
    { origin: "Abakaliki", destination: "Douala", base_rate_fcfa: 55000, active: true },
    { origin: "Abakaliki", destination: "Buea", base_rate_fcfa: 55000, active: true },
    { origin: "Abakaliki", destination: "Kumba", base_rate_fcfa: 50000, active: true },
    { origin: "Abakaliki", destination: "Mamfe", base_rate_fcfa: 0, active: true }, 
    { origin: "Enugu", destination: "Yaounde", base_rate_fcfa: 65000, active: true },
    { origin: "Enugu", destination: "Douala", base_rate_fcfa: 55000, active: true },
    { origin: "Enugu", destination: "Buea", base_rate_fcfa: 55000, active: true },
    { origin: "Enugu", destination: "Kumba", base_rate_fcfa: 50000, active: true },
    { origin: "Enugu", destination: "Mamfe", base_rate_fcfa: 0, active: true },
    { origin: "Onitsha", destination: "Yaounde", base_rate_fcfa: 65000, active: true },
    { origin: "Onitsha", destination: "Douala", base_rate_fcfa: 55000, active: true },
    { origin: "Onitsha", destination: "Buea", base_rate_fcfa: 55000, active: true },
    { origin: "Onitsha", destination: "Kumba", base_rate_fcfa: 50000, active: true },
    { origin: "Onitsha", destination: "Mamfe", base_rate_fcfa: 0, active: true },
    { origin: "Ikom", destination: "Yaounde", base_rate_fcfa: 60000, active: true },
    { origin: "Ikom", destination: "Douala", base_rate_fcfa: 50000, active: true },
    { origin: "Ikom", destination: "Buea", base_rate_fcfa: 50000, active: true },
    { origin: "Ikom", destination: "Kumba", base_rate_fcfa: 40000, active: true },
    { origin: "Ikom", destination: "Mamfe", base_rate_fcfa: 0, active: true },
  ];
  
  // also need the reverse direction
  const reverseRoutes = routesData.map(r => ({
      origin: r.destination,
      destination: r.origin,
      base_rate_fcfa: r.base_rate_fcfa,
      active: true
  }));

  const allRoutes = [...routesData, ...reverseRoutes];

  for(const r of allRoutes) {
      if (r.base_rate_fcfa === 0) continue; // Skip Mamfe <-> some places missing amounts
      const { data, error } = await supabase
          .from('routes')
          .update({ base_rate_fcfa: r.base_rate_fcfa })
          .match({ origin: r.origin, destination: r.destination });
          
      if(error) {
          console.error('Error updating', r.origin, '-', r.destination, error);
      } else {
          console.log('Updated', r.origin, '-', r.destination);
      }
  }
}
run();
