import React from 'react';
import Modal from '../../../shared/ui/Modal';

interface FinanceGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FinanceGuideModal: React.FC<FinanceGuideModalProps> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Panduan Halaman Keuangan">
            <div className="space-y-4 text-sm text-brand-text-primary">
                <p>Halaman ini adalah pusat komando Keuangan bisnis Anda. Gunakan berbagai tab untuk mendapatkan gambaran lengkap.</p>
                <ul className="list-disc list-inside space-y-2">
                    <li><strong>Transaksi:</strong> Catat semua pemasukan dan pengeluaran. Gunakan filter di sisi kiri untuk menganalisis berdasarkan kategori.</li>
                    <li><strong>Kantong:</strong> Buat &quot;kantong&quot; virtual untuk mengalokasikan dana, seperti tabungan alat atau anggaran operasional bulanan.</li>
                    <li><strong>Kartu Saya:</strong> Daftarkan semua akun bank, kartu kredit, dan kas tunai Anda untuk melacak saldo secara akurat.</li>
                    <li><strong>Arus Kas:</strong> Lihat grafik interaktif yang menunjukkan tren pemasukan, pengeluaran, dan saldo akhir Anda dari waktu ke waktu.</li>
                    <li><strong>Laporan:</strong> Hasilkan laporan keuangan profesional. Anda bisa memfilter berdasarkan pengantin dan rentang tanggal, lalu mencetaknya sebagai PDF.</li>
                </ul>
            </div>
        </Modal>
    );
};

export default FinanceGuideModal;
