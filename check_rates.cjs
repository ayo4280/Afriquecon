const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hniimfwovqqjfdwoixae.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuaWltZndvdnFxamZkd29peGFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjc1NTM0NywiZXhwIjoyMDk4MzMxMzQ3fQ.EI0PEkdKKrFwU89x4SlT0Ei3w-Ga3y_hChni923w90k'
);

async function run() {
    const { data: routeList, error: errList } = await supabase.from('routes').select('*');
    if (errList) { console.log(errList); return; }
    
    // We need to determine if a route is going from a Nigerian city to a Cameroonian city, or vice-versa.
    const cameroonCities = ["Douala", "Yaounde", "Yaoundé", "Buea", "Kumba", "Mamfe", "Bamenda"];
    // In our DB, "Yaoundé" has an accent, let's normalize in check.
    
    for (const r of routeList) {
        const o = r.origin;
        const d = r.destination;
        let cfaForNigerians = r.base_rate_fcfa;
        let cfaForNonNigerians = r.base_rate_fcfa;
        
        // According to the image provided:
        // Lagos/Abuja/Abakaliki/Enugu/Onitsha/Ikom to Cameroon (and vice-versa) 
        // We'll set the base_rate_fcfa based on the Nigerian list.
        // We actually already set the base_rate_fcfa to the "Amount in FCFA for Nigerians".
        
        // The PDF specifies a different amount for Non-Nigerians (usually the same, sometimes different).
        // If we want to store both in the DB, we'd need a new column. 
        // For now, keeping the base_rate_fcfa updated to the Nigerian values is done. 
        // Let's verify what values were placed.
        console.log(`${o} to ${d}: ${r.base_rate_fcfa}`);
    }
}
run();
