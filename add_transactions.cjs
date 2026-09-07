const fs = require('fs');
const filePath = 'D:/aplikasi 2026 benar/vendor phtotogrpahy 20206/atter/supabase/11_seed_mock_100_clients_projects.sql';

const cardId = '9852e6ee-3626-4f78-a743-7922e1db33ab';

// Helper untuk generate UUID valid
const uid = (prefix, num) => {
  const hex = num.toString(16).padStart(12, '0');
  return `${prefix}1a0000-0000-4000-8000-${hex}`;
};

// ==============================================
// Kategori & Data Freelancer
// ==============================================
const freelancers = [
  { name: 'Andi Fotografer', role: 'Fotografer Kedua', fee: 800000 },
  { name: 'Beni Videografer', role: 'Videografer', fee: 1000000 },
  { name: 'Caca Editor', role: 'Editor Foto', fee: 600000 },
  { name: 'Dian MUA', role: 'Make Up Artist', fee: 500000 },
  { name: 'Eko Drone Pilot', role: 'Operator Drone', fee: 750000 },
  { name: 'Fifi Asisten Foto', role: 'Asisten Fotografer', fee: 400000 },
  { name: 'Gani Videografer Senior', role: 'Videografer Senior', fee: 1200000 },
  { name: 'Heni Editor Video', role: 'Editor Video', fee: 800000 },
  { name: 'Ivan Sound Engineer', role: 'Sound Engineer', fee: 650000 },
  { name: 'Joko Fotografer Wedding', role: 'Fotografer', fee: 900000 },
];

const projectIds = Array.from({length: 100}, (_, i) => `f${(i+1).toString().padStart(7,'0')}-0000-0000-0000-${(i+1).toString().padStart(12,'0')}`);

// ============================================================
// BUAT TRANSAKSI BATCH
// ============================================================
let rows = [];
let counter = 200; // mulai dari 200 agar tidak konflik dgn yg sudah ada

const row = (id, date, desc, amount, type, projectId, category, method) => {
  const proj = projectId ? `'${projectId}'` : 'NULL';
  return `('${id}', ${date}, '${desc}', ${amount}, '${type}', ${proj}, '${category}', '${method}', '${cardId}')`;
};

// ==============================================
// A. PEMBAYARAN FREELANCER (Gaji Tim / Vendor)
// ==============================================
// Per proyek (pilih 40 proyek), 1 pembayaran freelancer
for (let i = 0; i < 40; i++) {
  const freelancer = freelancers[i % freelancers.length];
  const proj = projectIds[i];
  const daysAgo = Math.floor(Math.random() * 90) + 5;
  counter++;
  rows.push(row(
    uid('c', counter),
    `NOW() - INTERVAL '${daysAgo} days'`,
    `Pembayaran ${freelancer.role} - ${freelancer.name}`,
    freelancer.fee,
    'Pengeluaran',
    proj,
    'Gaji Tim / Vendor',
    'Transfer Bank'
  ));
}

// ==============================================
// B. BIAYA OPERASIONAL RUTIN
// ==============================================
const opCosts = [
  { desc: 'Sewa studio bulanan', amount: 2000000, cat: 'Sewa Tempat' },
  { desc: 'Listrik studio', amount: 450000, cat: 'Lain-lain' },
  { desc: 'Internet kantor bulanan', amount: 350000, cat: 'Lain-lain' },
  { desc: 'Langganan Adobe Creative Cloud', amount: 600000, cat: 'Peralatan' },
  { desc: 'Langganan Lightroom preset premium', amount: 250000, cat: 'Produksi' },
  { desc: 'Servis kamera utama', amount: 1200000, cat: 'Peralatan' },
  { desc: 'Beli memori card 256GB x2', amount: 900000, cat: 'Peralatan' },
  { desc: 'Isi tinta printer foto', amount: 400000, cat: 'Produksi' },
  { desc: 'Cetak album premium x3', amount: 1500000, cat: 'Produksi' },
  { desc: 'Beli drone filter ND set', amount: 750000, cat: 'Peralatan' },
  { desc: 'Beli tripod video slider', amount: 1100000, cat: 'Peralatan' },
  { desc: 'Kalibrasi lensa 50mm', amount: 300000, cat: 'Peralatan' },
  { desc: 'Pembelian harddisk external 4TB', amount: 1300000, cat: 'Peralatan' },
  { desc: 'Langganan Google Drive 2TB', amount: 150000, cat: 'Lain-lain' },
  { desc: 'Konsumsi tim saat liputan', amount: 350000, cat: 'Konsumsi' },
  { desc: 'Bensin operasional bulan ini', amount: 600000, cat: 'Transportasi' },
  { desc: 'Parkir dan tol liputan', amount: 200000, cat: 'Transportasi' },
  { desc: 'Cetak kartu nama & brosur', amount: 450000, cat: 'Produksi' },
  { desc: 'Beli softbox lighting set', amount: 2200000, cat: 'Peralatan' },
  { desc: 'Upgrade lensa 85mm f/1.4', amount: 8500000, cat: 'Peralatan' },
];

opCosts.forEach((op, i) => {
  const daysAgo = Math.floor(Math.random() * 85) + 3;
  counter++;
  rows.push(row(
    uid('d', counter),
    `NOW() - INTERVAL '${daysAgo} days'`,
    op.desc,
    op.amount,
    'Pengeluaran',
    null,
    op.cat,
    i % 3 === 0 ? 'Transfer Bank' : 'Tunai'
  ));
});

// ==============================================
// C. PEMASUKAN TAMBAHAN (Modal, Referral, dll)
// ==============================================
const extraIncome = [
  { desc: 'Bonus referral dari rekan fotografer - Agustus', amount: 500000, cat: 'Lain-lain' },
  { desc: 'Penjualan foto stok ke agensi', amount: 1200000, cat: 'Lain-lain' },
  { desc: 'Workshop fotografi dasar - 10 peserta', amount: 3000000, cat: 'Lain-lain' },
  { desc: 'Sewa kamera ke rekan - 3 hari', amount: 600000, cat: 'Lain-lain' },
  { desc: 'Topup modal awal dari pemilik', amount: 5000000, cat: 'Modal' },
  { desc: 'Pelunasan hutang rekan - Luna Studio', amount: 2000000, cat: 'Lain-lain' },
  { desc: 'Fee konsultasi foto produk - Brand X', amount: 1500000, cat: 'Lain-lain' },
  { desc: 'Bonus kerjasama event organizer', amount: 800000, cat: 'Lain-lain' },
  { desc: 'Penjualan preset Lightroom custom', amount: 450000, cat: 'Lain-lain' },
  { desc: 'Retainer klien korporat bulan Juli', amount: 4000000, cat: 'Booking DP' },
  { desc: 'Retainer klien korporat bulan Agustus', amount: 4000000, cat: 'Booking DP' },
  { desc: 'Penjualan foto via Shutterstock', amount: 350000, cat: 'Lain-lain' },
];

extraIncome.forEach((inc, i) => {
  const daysAgo = Math.floor(Math.random() * 80) + 5;
  counter++;
  rows.push(row(
    uid('e', counter),
    `NOW() - INTERVAL '${daysAgo} days'`,
    inc.desc,
    inc.amount,
    'Pemasukan',
    null,
    inc.cat,
    i % 2 === 0 ? 'Transfer Bank' : 'Tunai'
  ));
});

// ==============================================
// D. PEMBAYARAN FREELANCER LANJUTAN (per proyek 41-80)
// ==============================================
for (let i = 40; i < 80; i++) {
  const freelancer = freelancers[i % freelancers.length];
  const proj = projectIds[i];
  const daysAgo = Math.floor(Math.random() * 90) + 3;
  counter++;
  rows.push(row(
    uid('f', counter),
    `NOW() - INTERVAL '${daysAgo} days'`,
    `Honor ${freelancer.role} - ${freelancer.name} (proyek ${i+1})`,
    freelancer.fee,
    'Pengeluaran',
    proj,
    'Gaji Tim / Vendor',
    'Transfer Bank'
  ));
}

// ==============================================
// E. BIAYA TRANSPORT LIPUTAN (per proyek pilihan)
// ==============================================
const venues = [
  'Bali', 'Bandung', 'Semarang', 'Surabaya', 'Malang',
  'Medan', 'Makassar', 'Yogyakarta', 'Palembang', 'Lombok'
];
for (let i = 0; i < 25; i++) {
  const proj = projectIds[i * 3 % 100];
  const venue = venues[i % venues.length];
  const daysAgo = Math.floor(Math.random() * 85) + 5;
  counter++;
  rows.push(row(
    uid('g', counter),
    `NOW() - INTERVAL '${daysAgo} days'`,
    `Tiket pesawat + penginapan liputan ${venue}`,
    Math.floor(Math.random() * 2000000) + 800000,
    'Pengeluaran',
    proj,
    'Transportasi',
    'Transfer Bank'
  ));
}

// ==============================================
// F. BIAYA PRODUKSI CETAK ALBUM (per proyek pilihan)
// ==============================================
const albumTypes = [
  'Album premium hardcover 30x40cm',
  'Album flush mount 20x30cm',
  'Photobook softcover A4',
  'Cetak kanvas 60x90cm',
  'Frame akrilik 30x40cm set',
];
for (let i = 0; i < 20; i++) {
  const proj = projectIds[i * 4 % 100];
  const album = albumTypes[i % albumTypes.length];
  const daysAgo = Math.floor(Math.random() * 60) + 5;
  counter++;
  rows.push(row(
    uid('h', counter),
    `NOW() - INTERVAL '${daysAgo} days'`,
    `Cetak ${album} - proyek ${i+1}`,
    Math.floor(Math.random() * 800000) + 300000,
    'Pengeluaran',
    proj,
    'Produksi',
    'Transfer Bank'
  ));
}

// ==============================================
// G. PEMASUKAN SEPTEMBER (bulan ini) - LEBIH BANYAK
// ==============================================
const septemberIncome = [
  { desc: 'DP Erik & Galuh Wedding Premium - sisa', amount: 4250000, proj: projectIds[30], cat: 'Pelunasan' },
  { desc: 'DP Satria & Vina Wedding Premium', amount: 4250000, proj: projectIds[70], cat: 'Booking DP' },
  { desc: 'DP Munir & Popi Wedding Premium', amount: 4250000, proj: projectIds[90], cat: 'Booking DP' },
  { desc: 'Pelunasan Gilang & Intan Wedding', amount: 8500000, proj: projectIds[6], cat: 'Pelunasan' },
  { desc: 'DP Ciko & Feny Wedding Premium', amount: 4250000, proj: projectIds[80], cat: 'Booking DP' },
  { desc: 'Retainer korporat September', amount: 4000000, proj: null, cat: 'Booking DP' },
  { desc: 'Pelunasan Kevin & Mita Wedding', amount: 5000000, proj: projectIds[36], cat: 'Pelunasan' },
];

const septemberExpense = [
  { desc: 'Sewa studio bulan September', amount: 2000000, proj: null, cat: 'Sewa Tempat' },
  { desc: 'Gaji Andi Fotografer September', amount: 800000, proj: projectIds[0], cat: 'Gaji Tim / Vendor' },
  { desc: 'Gaji Beni Videografer September', amount: 1000000, proj: projectIds[1], cat: 'Gaji Tim / Vendor' },
  { desc: 'Gaji Heni Editor Video September', amount: 800000, proj: null, cat: 'Gaji Tim / Vendor' },
  { desc: 'Internet & listrik September', amount: 800000, proj: null, cat: 'Lain-lain' },
  { desc: 'Bensin & transport September', amount: 600000, proj: null, cat: 'Transportasi' },
  { desc: 'Konsumsi liputan September', amount: 450000, proj: projectIds[5], cat: 'Konsumsi' },
];

let sepCount = 20;
septemberIncome.forEach(inc => {
  sepCount++;
  counter++;
  const daysAgo = Math.floor(Math.random() * 2); // 0-2 hari lalu (bulan ini)
  rows.push(row(
    uid('i', counter),
    daysAgo === 0 ? 'NOW()' : `NOW() - INTERVAL '${daysAgo} days'`,
    inc.desc,
    inc.amount,
    'Pemasukan',
    inc.proj,
    inc.cat,
    'Transfer Bank'
  ));
});

septemberExpense.forEach(exp => {
  sepCount++;
  counter++;
  const daysAgo = Math.floor(Math.random() * 2);
  rows.push(row(
    uid('j', counter),
    daysAgo === 0 ? 'NOW()' : `NOW() - INTERVAL '${daysAgo} days'`,
    exp.desc,
    exp.amount,
    'Pengeluaran',
    exp.proj,
    exp.cat,
    exp.cat === 'Gaji Tim / Vendor' ? 'Transfer Bank' : 'Tunai'
  ));
});

// ==============================================
// TULIS KE FILE
// ==============================================
const sql = `
-- ==============================================
-- 8. MOCK DATA TRANSAKSI TAMBAHAN
--    A. Pembayaran Freelancer & Tim
--    B. Biaya Operasional Rutin
--    C. Pemasukan Tambahan (Referral, Workshop, dll)
--    D. Transport & Penginapan Liputan
--    E. Biaya Cetak Album per Proyek
--    F. Transaksi September (bulan ini)
-- ==============================================
INSERT INTO "public"."transactions" ("id","date","description","amount","type","project_id","category","method","card_id") VALUES
${rows.join(',\n')}
ON CONFLICT (id) DO NOTHING;

-- Update balance kartu berdasarkan NET semua transaksi
UPDATE "public"."cards"
SET "balance" = (
    SELECT COALESCE(
        SUM(CASE WHEN t.type = 'Pemasukan' THEN t.amount ELSE -t.amount END),
        0
    )
    FROM "public"."transactions" t
    WHERE t.card_id = '${cardId}'
)
WHERE id = '${cardId}';
`;

// Sisipkan sebelum "-- Re-enable FK checks"
const content = fs.readFileSync(filePath, 'utf8');
const updated = content.replace(
  /-- Re-enable FK checks\nSET session_replication_role = 'origin';/,
  sql + '\n-- Re-enable FK checks\nSET session_replication_role = \'origin\';'
);
fs.writeFileSync(filePath, updated, 'utf8');
console.log(`✅ Berhasil tambah ${rows.length} baris transaksi!`);
