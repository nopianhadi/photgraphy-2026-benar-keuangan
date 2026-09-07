import React from 'react';
import { Card, CardType, FinancialPocket, PocketType, Profile, Project, TransactionType } from '../../../types';
import Modal from '../../../shared/ui/Modal';
import RupiahInput from '../../../shared/form/RupiahInput';
import { formatCurrency } from '../../../utils/currency';

interface FinanceFormModalProps {
    modalState: {
        type: null | 'transaction' | 'pocket' | 'card' | 'transfer' | 'topup-cash';
        mode: 'add' | 'edit';
        data?: any;
    };
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    form: any;
    setForm: React.Dispatch<React.SetStateAction<any>>;
    handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    isSubmitting: boolean;
    profile: Profile;
    cards: Card[];
    pockets: FinancialPocket[];
    projects: Project[];
    transactionProjectMonthFilter: string;
    setTransactionProjectMonthFilter: (val: string) => void;
    pocketIcons: { [key: string]: React.ReactNode };
}

const FinanceFormModal: React.FC<FinanceFormModalProps> = ({
    modalState,
    onClose,
    onSubmit,
    form,
    setForm,
    handleFormChange,
    isSubmitting,
    profile,
    cards,
    pockets,
    projects,
    transactionProjectMonthFilter,
    setTransactionProjectMonthFilter,
    pocketIcons
}) => {
    if (!modalState.type) return null;

    const modalTitle = `${modalState.mode === 'add' ? 'Tambah' : 'Edit'} ${
        modalState.type === 'transaction' ? 'Transaksi' :
        modalState.type === 'pocket' ? 'Kantong' :
        modalState.type === 'card' ? 'Kartu/Akun' :
        modalState.type === 'topup-cash' ? 'Top-up Tunai' :
        (modalState.type === 'transfer' && form.type === 'withdraw') ? `Tarik Dana dari "${modalState.data?.name}"` :
        (modalState.type === 'transfer' && form.type === 'deposit') ? `Setor Dana ke "${modalState.data?.name}"` :
        'Transfer'
    }`;

    return (
        <Modal
            isOpen={!!modalState.type}
            onClose={onClose}
            title={modalTitle}
        >
            <form onSubmit={onSubmit} className="space-y-4">
                {modalState.type === 'transaction' && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="input-group">
                                <select id="type" name="type" value={form.type} onChange={handleFormChange} className="input-field">
                                    <option value={TransactionType.EXPENSE}>Pengeluaran</option>
                                    <option value={TransactionType.INCOME}>Pemasukan</option>
                                </select>
                                <label htmlFor="type" className="input-label">Jenis</label>
                            </div>
                            <div className="input-group">
                                <input type="date" id="date" name="date" value={form.date} onChange={handleFormChange} className="input-field" placeholder=" " />
                                <label htmlFor="date" className="input-label">Tanggal</label>
                            </div>
                        </div>
                        <div className="input-group">
                            <input type="text" id="description" name="description" value={form.description} onChange={handleFormChange} className="input-field" placeholder=" " required />
                            <label htmlFor="description" className="input-label">Deskripsi</label>
                        </div>
                        <div className="input-group">
                            <RupiahInput
                                id="amount"
                                name="amount"
                                value={String(form.amount ?? '')}
                                onChange={(raw) => setForm((prev: any) => ({ ...prev, amount: raw }))}
                                className="input-field"
                                placeholder=" "
                                required
                            />
                            <label htmlFor="amount" className="input-label">Jumlah (IDR)</label>
                        </div>
                        <div className="input-group">
                            <select id="category" name="category" value={form.category} onChange={handleFormChange} className="input-field" required>
                                <option value="">Pilih Kategori...</option>
                                {(form.type === TransactionType.INCOME ? profile.incomeCategories : profile.expenseCategories).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <label htmlFor="category" className="input-label">Kategori</label>
                        </div>
                        {form.type === TransactionType.INCOME ? (
                            <div className="input-group">
                                <select id="cardId" name="cardId" value={form.cardId || ''} onChange={handleFormChange} className="input-field" required>
                                    <option value="">Pilih Tujuan...</option>
                                    {cards.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.cardHolderName} {c.cardType !== CardType.TUNAI ? `(${c.bankName} **** ${c.lastFourDigits})` : '(Tunai)'} (Saldo: {formatCurrency(c.balance)})
                                        </option>
                                    ))}
                                </select>
                                <label htmlFor="cardId" className="input-label">Setor Ke</label>
                            </div>
                        ) : (
                            <div className="input-group">
                                <select id="sourceId" name="sourceId" value={form.sourceId} onChange={handleFormChange} className="input-field" required>
                                    <option value="">Pilih Sumber...</option>
                                    {cards.map(c => (
                                        <option key={c.id} value={`card-${c.id}`}>
                                            {c.cardHolderName} {c.cardType !== CardType.TUNAI ? `(${c.bankName} **** ${c.lastFourDigits})` : '(Tunai)'} (Saldo: {formatCurrency(c.balance)})
                                        </option>
                                    ))}
                                    {pockets.filter(p => p.type === PocketType.EXPENSE).map(p => (
                                        <option key={p.id} value={`pocket-${p.id}`}>
                                            {p.name} (Sisa: {formatCurrency(p.amount)})
                                        </option>
                                    ))}
                                </select>
                                <label htmlFor="sourceId" className="input-label">Sumber Dana</label>
                            </div>
                        )}

                        <div className="input-group flex gap-2">
                            <div className="flex-1 relative">
                                <select
                                    id="projectId"
                                    name="projectId"
                                    value={form.projectId || ''}
                                    onChange={handleFormChange}
                                    className="input-field"
                                >
                                    <option value="">Tidak Terkait Proyek</option>
                                    {projects
                                        .filter(p => {
                                            if (!transactionProjectMonthFilter) return true;
                                            if (!p.date) return true;
                                            const pDate = new Date(p.date);
                                            const [fYear, fMonth] = transactionProjectMonthFilter.split('-');
                                            return pDate.getFullYear() === parseInt(fYear) && (pDate.getMonth() + 1) === parseInt(fMonth);
                                        })
                                        .map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.projectName} ({p.clientName})
                                            </option>
                                        ))}
                                </select>
                                <label htmlFor="projectId" className="input-label">Terkait Proyek (Opsional)</label>
                            </div>
                            <div className="w-1/3 relative">
                                <input
                                    type="month"
                                    value={transactionProjectMonthFilter}
                                    onChange={(e) => setTransactionProjectMonthFilter(e.target.value)}
                                    className="input-field text-sm p-2 h-full"
                                    title="Filter Bulan Proyek"
                                />
                                <label className="input-label text-[10px]">Bulan Proyek</label>
                            </div>
                        </div>
                    </>
                )}

                {modalState.type === 'card' && (
                    <>
                        <div className="input-group">
                            <select id="cardType" name="cardType" value={form.cardType} onChange={handleFormChange} className="input-field">
                                {Object.values(CardType).map(ct => <option key={ct} value={ct}>{ct}</option>)}
                            </select>
                            <label htmlFor="cardType" className="input-label">Jenis Akun</label>
                        </div>
                        <div className="input-group">
                            <input type="text" id="cardHolderName" name="cardHolderName" value={form.cardHolderName} onChange={handleFormChange} className="input-field" placeholder=" " required />
                            <label htmlFor="cardHolderName" className="input-label">{form.cardType === CardType.TUNAI ? 'Nama Akun Kas' : 'Nama Pemegang Kartu'}</label>
                        </div>
                        {modalState.mode === 'add' && (
                            <div className="input-group">
                                <RupiahInput
                                    id="initialBalance"
                                    name="initialBalance"
                                    value={String(form.initialBalance ?? '')}
                                    onChange={(raw) => setForm((prev: any) => ({ ...prev, initialBalance: raw }))}
                                    className="input-field"
                                    placeholder=" "
                                />
                                <label htmlFor="initialBalance" className="input-label">Saldo Awal (Opsional)</label>
                            </div>
                        )}

                        {form.cardType !== CardType.TUNAI ? (
                            <>
                                <div className="input-group">
                                    <input type="text" id="bankName" name="bankName" value={form.bankName} onChange={handleFormChange} className="input-field" placeholder=" " required />
                                    <label htmlFor="bankName" className="input-label">Nama Bank</label>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="input-group">
                                        <input type="text" id="lastFourDigits" name="lastFourDigits" value={form.lastFourDigits} onChange={handleFormChange} className="input-field" placeholder=" " maxLength={4} required />
                                        <label htmlFor="lastFourDigits" className="input-label">4 Digit Terakhir</label>
                                    </div>
                                    <div className="input-group">
                                        <input type="text" id="expiryDate" name="expiryDate" value={form.expiryDate} onChange={handleFormChange} className="input-field" placeholder="MM/YY" />
                                        <label htmlFor="expiryDate" className="input-label">Kadaluwarsa</label>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="p-3 bg-brand-bg rounded-lg text-sm text-brand-text-secondary">
                                Anda sedang membuat akun kas tunai. Detail lainnya akan diisi secara otomatis.
                            </div>
                        )}

                        {modalState.mode === 'edit' && (
                            <div className="p-4 bg-brand-bg rounded-lg mt-6">
                                <h4 className="font-semibold text-gradient mb-2">Penyesuaian Saldo (Opsional)</h4>
                                <p className="text-xs text-brand-text-secondary mb-3">Isi untuk menambah atau mengurangi saldo. Gunakan angka negatif untuk mengurangi (misal: -50000).</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="input-group !mt-0">
                                        <RupiahInput
                                            id="adjustmentAmount"
                                            name="adjustmentAmount"
                                            value={String(form.adjustmentAmount ?? '')}
                                            onChange={(raw) => setForm((prev: any) => ({ ...prev, adjustmentAmount: raw }))}
                                            className="input-field"
                                            placeholder=" "
                                            allowNegative
                                        />
                                        <label htmlFor="adjustmentAmount" className="input-label">Jumlah Penyesuaian</label>
                                    </div>
                                    <div className="input-group !mt-0">
                                        <input type="text" id="adjustmentReason" name="adjustmentReason" value={form.adjustmentReason} onChange={handleFormChange} className="input-field" placeholder=" " />
                                        <label htmlFor="adjustmentReason" className="input-label">Alasan (e.g., Koreksi)</label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {modalState.type === 'pocket' && (
                    <>
                        <div className="input-group">
                            <input type="text" id="name" name="name" value={form.name} onChange={handleFormChange} className="input-field" placeholder=" " required />
                            <label htmlFor="name" className="input-label">Nama Kantong</label>
                        </div>
                        <div className="input-group">
                            <textarea id="description" name="description" value={form.description} onChange={handleFormChange} className="input-field" placeholder=" " rows={2} />
                            <label htmlFor="description" className="input-label">Deskripsi</label>
                        </div>
                        <div className="input-group">
                            <select id="sourceCardId" name="sourceCardId" value={form.sourceCardId} onChange={handleFormChange} className="input-field">
                                <option value="">Pilih Kartu...</option>
                                {cards.map(c => (
                                    <option key={c.id} value={c.id}>{c.bankName} {c.cardType !== CardType.TUNAI && `**** ${c.lastFourDigits}`}</option>
                                ))}
                            </select>
                            <label htmlFor="sourceCardId" className="input-label">Sumber Dana (Kartu)</label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="input-group">
                                <select id="icon" name="icon" value={form.icon} onChange={handleFormChange} className="input-field">
                                    {Object.keys(pocketIcons).map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                                <label htmlFor="icon" className="input-label">Ikon</label>
                            </div>
                            <div className="input-group">
                                <select name="type" id="type" value={form.type} onChange={handleFormChange} className="input-field">
                                    {Object.values(PocketType).map(pt => <option key={pt} value={pt}>{pt}</option>)}
                                </select>
                                <label htmlFor="type" className="input-label">Tipe Kantong</label>
                            </div>
                        </div>
                        {(form.type === PocketType.SAVING || form.type === PocketType.EXPENSE) && (
                            <div className="input-group">
                                <RupiahInput
                                    id="goalAmount"
                                    name="goalAmount"
                                    value={String(form.goalAmount ?? '')}
                                    onChange={(raw) => setForm((prev: any) => ({ ...prev, goalAmount: raw }))}
                                    className="input-field"
                                    placeholder=" "
                                />
                                <label htmlFor="goalAmount" className="input-label">Target Jumlah (Opsional)</label>
                            </div>
                        )}
                        {form.type === PocketType.LOCKED && (
                            <div className="input-group">
                                <input type="date" id="lockEndDate" name="lockEndDate" value={form.lockEndDate || ''} onChange={handleFormChange} className="input-field" placeholder=" " />
                                <label htmlFor="lockEndDate" className="input-label">Tgl. Kunci Berakhir (Opsional)</label>
                            </div>
                        )}
                    </>
                )}

                {modalState.type === 'transfer' && (
                    <>
                        <div className="input-group">
                            <select id="fromCardId" name="fromCardId" value={form.fromCardId} onChange={handleFormChange} className="input-field" required>
                                <option value="">Pilih Kartu Sumber...</option>
                                {cards.filter(c => c.cardType !== CardType.TUNAI).map(c => (
                                    <option key={c.id} value={c.id}>{c.bankName} **** {c.lastFourDigits} (Saldo: {formatCurrency(c.balance)})</option>
                                ))}
                            </select>
                            <label htmlFor="fromCardId" className="input-label">Sumber Dana</label>
                        </div>
                        <div className="input-group">
                            <RupiahInput
                                id="amount"
                                name="amount"
                                value={String(form.amount ?? '')}
                                onChange={(raw) => setForm((prev: any) => ({ ...prev, amount: raw }))}
                                className="input-field"
                                placeholder=" "
                                required
                            />
                            <label htmlFor="amount" className="input-label">Jumlah (IDR)</label>
                        </div>
                    </>
                )}

                {modalState.type === 'topup-cash' && (
                    <>
                        <div className="input-group">
                            <select id="fromCardId" name="fromCardId" value={form.fromCardId} onChange={handleFormChange} className="input-field" required>
                                <option value="">Pilih Kartu Sumber...</option>
                                {cards.filter(c => c.cardType !== CardType.TUNAI).map(c => (
                                    <option key={c.id} value={c.id}>{c.bankName} **** {c.lastFourDigits} (Saldo: {formatCurrency(c.balance)})</option>
                                ))}
                            </select>
                            <label htmlFor="fromCardId" className="input-label">Ambil dari Kartu</label>
                        </div>
                        <div className="input-group">
                            <RupiahInput
                                id="amount"
                                name="amount"
                                value={String(form.amount ?? '')}
                                onChange={(raw) => setForm((prev: any) => ({ ...prev, amount: raw }))}
                                className="input-field"
                                placeholder=" "
                                required
                            />
                            <label htmlFor="amount" className="input-label">Jumlah (IDR)</label>
                        </div>
                    </>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t border-brand-border">
                    <button type="button" onClick={onClose} className="button-secondary">Batal</button>
                    <button type="submit" disabled={isSubmitting} className="button-primary">
                        {isSubmitting ? 'Menyimpan...' : (modalState.mode === 'add' ? 'Simpan' : 'Update')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default FinanceFormModal;
