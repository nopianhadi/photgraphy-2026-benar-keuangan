import React from 'react';
import Modal from '../../../shared/ui/Modal';
import RupiahInput from '../../../shared/form/RupiahInput';
import { Card } from '../../../types';

export interface TxFormData {
    date: string;
    description: string;
    amount: number;
    category: string;
    method: string;
    cardId: string;
}

interface ClientTransactionEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    txFormData: TxFormData;
    setTxFormData: React.Dispatch<React.SetStateAction<TxFormData>>;
    onSubmit: (e: React.FormEvent) => void;
    cards: Card[];
}

export const ClientTransactionEditModal: React.FC<ClientTransactionEditModalProps> = ({
    isOpen,
    onClose,
    txFormData,
    setTxFormData,
    onSubmit,
    cards,
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Transaksi / Tanda Terima" size="lg">
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="input-group">
                        <input
                            type="date"
                            value={txFormData.date}
                            onChange={e => setTxFormData(prev => ({ ...prev, date: e.target.value }))}
                            className="input-field"
                            required
                        />
                        <label className="input-label">Tanggal</label>
                    </div>
                    <div className="input-group">
                        <RupiahInput
                            value={String(txFormData.amount)}
                            onChange={val => setTxFormData(prev => ({ ...prev, amount: Number(val) }))}
                            className="input-field"
                            required
                        />
                        <label className="input-label">Jumlah</label>
                    </div>
                </div>
                <div className="input-group">
                    <input
                        type="text"
                        value={txFormData.description}
                        onChange={e => setTxFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="input-field"
                        required
                    />
                    <label className="input-label">Deskripsi / Tujuan Pembayaran</label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="input-group">
                        <select
                            value={txFormData.category}
                            onChange={e => setTxFormData(prev => ({ ...prev, category: e.target.value }))}
                            className="input-field"
                            required
                        >
                            <option value="">Pilih Kategori...</option>
                            <option value="Pelunasan Acara Pernikahan">Pelunasan Acara Pernikahan</option>
                            <option value="Booking Fee">Booking Fee</option>
                            <option value="Biaya Tambahan">Biaya Tambahan</option>
                            <option value="Gaji Tim / Vendor">Gaji Tim / Vendor</option>
                            <option value="Transportasi">Transportasi</option>
                            <option value="Lain-lain">Lain-lain</option>
                        </select>
                        <label className="input-label">Kategori</label>
                    </div>
                    <div className="input-group">
                        <select
                            value={txFormData.method}
                            onChange={e => setTxFormData(prev => ({ ...prev, method: e.target.value }))}
                            className="input-field"
                            required
                        >
                            <option value="Transfer Bank">Transfer Bank</option>
                            <option value="Tunai">Tunai</option>
                            <option value="E-Wallet">E-Wallet</option>
                            <option value="Kartu Kredit">Kartu Kredit</option>
                        </select>
                        <label className="input-label">Metode</label>
                    </div>
                </div>
                <div className="input-group">
                    <select
                        value={txFormData.cardId}
                        onChange={e => setTxFormData(prev => ({ ...prev, cardId: e.target.value }))}
                        className="input-field"
                        required
                    >
                        <option value="">Pilih Rekening / Kartu...</option>
                        {cards.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.bankName} {c.lastFourDigits !== 'CASH' ? `**** ${c.lastFourDigits}` : '(Tunai)'}
                            </option>
                        ))}
                    </select>
                    <label className="input-label">Rekening / Kartu</label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
                    <button type="button" onClick={onClose} className="button-secondary">
                        Batal
                    </button>
                    <button type="submit" className="button-primary">
                        Simpan Perubahan
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ClientTransactionEditModal;
