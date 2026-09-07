const fs = require('fs');
let sql = '\n-- ==============================================\n';
sql += '-- 5. INSERT 100 CONTRACTS\n';
sql += '-- ==============================================\n';
sql += 'INSERT INTO "public"."contracts" ("id", "contract_number", "client_id", "project_id", "signing_date", "signing_location", "client_name1", "client_address1", "client_phone1", "shooting_duration", "guaranteed_photos", "album_details", "digital_files_format", "personnel_count", "delivery_timeframe", "cancellation_policy", "jurisdiction", "include_meterai") VALUES\n';
for (let i = 1; i <= 100; i++) {
  const pad = i.toString().padStart(3, '0');
  const pad2 = i.toString().padStart(12, '0');
  const id = `x0000000-0000-0000-0000-${pad2}`.replace('x0000000', `x${pad.padStart(7, '0')}`);
  const cid = `c0000000-0000-0000-0000-${pad2}`.replace('c0000000', `c${pad.padStart(7, '0')}`);
  const pid = `f0000000-0000-0000-0000-${pad2}`.replace('f0000000', `f${pad.padStart(7, '0')}`);
  const contractNumber = `KONTRAK/2026/09/${pad}`;
  const endLine = i === 100 ? '' : ',';
  sql += `('${id}', '${contractNumber}', '${cid}', '${pid}', NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days', 'Kantor Vendor', 'Klien ${i}', 'Alamat ${i}', '08123456${pad}', '8 Jam', '100 Foto Edited', '1 Album Eksklusif 10x15', 'Flashdisk', '2 Fotografer 1 Videografer', '14 Hari Kerja', 'DP Hangus', 'Pengadilan Negeri setempat', true)${endLine}\n`;
}
sql += 'ON CONFLICT (id) DO NOTHING;\n';
fs.appendFileSync('D:/aplikasi 2026 benar/vendor phtotogrpahy 20206/atter/supabase/11_seed_mock_100_clients_projects.sql', sql);
