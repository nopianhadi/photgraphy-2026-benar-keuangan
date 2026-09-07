const fs = require('fs');
const filePath = 'D:/aplikasi 2026 benar/vendor phtotogrpahy 20206/atter/supabase/11_seed_mock_100_clients_projects.sql';
let content = fs.readFileSync(filePath, 'utf8');

// Tambah header BEGIN dan SET di awal
const header = `-- 11_seed_mock_100_clients_projects.sql
-- Mock data untuk testing: 1 card bank, 100 klien, 100 proyek, transaksi untuk setiap klien
-- JALANKAN SELURUH SCRIPT INI SEKALIGUS (Ctrl+A lalu Run)

BEGIN;

-- Disable FK checks sementara
SET session_replication_role = 'replica';

`;

// Tambah COMMIT di akhir
const footer = `
-- Re-enable FK checks
SET session_replication_role = 'origin';

COMMIT;
`;

// Hapus header lama (2 baris komentar pertama)
content = content.replace(/^-- 11_seed_mock_100_clients_projects\.sql\r?\n-- Mock data[^\n]*\r?\n\r?\n/, '');

// Tulis ulang
fs.writeFileSync(filePath, header + content + footer, 'utf8');
console.log('File diperbarui dengan BEGIN/COMMIT dan FK bypass!');
