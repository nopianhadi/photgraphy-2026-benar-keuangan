import React from 'react';
import { Pencil as PencilIcon } from 'lucide-react';
import { TeamMember, TeamProjectPayment, Card, FinancialPocket } from '../../../types';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export interface CreatePaymentTabProps {
  member: TeamMember;
  paymentDetails: { projects: TeamProjectPayment[]; total: number };
  paymentAmount: number | '';
  setPaymentAmount: React.Dispatch<React.SetStateAction<number | ''>>;
  isInstallment: boolean;
  setIsInstallment: React.Dispatch<React.SetStateAction<boolean>>;
  onPay: () => void;
  onSetTab: (tab: 'projects') => void;
  renderPaymentDetailsContent: () => React.ReactNode;
  cards: Card[];
  monthlyBudgetPocket: FinancialPocket | undefined;
  paymentSourceId: string;
  setPaymentSourceId: (id: string) => void;
  onSign: () => void;
}

export const CreatePaymentTab: React.FC<CreatePaymentTabProps> = ({
  paymentDetails,
  paymentAmount,
  setPaymentAmount,
  isInstallment,
  setIsInstallment,
  onPay,
  renderPaymentDetailsContent,
  cards,
  monthlyBudgetPocket,
  paymentSourceId,
  setPaymentSourceId,
  onSign,
}) => (
  <div className="space-y-5">
    {/* Slip preview */}
    <div className="rounded-2xl border border-brand-border overflow-hidden">
      <div className="px-4 py-2.5 bg-brand-bg/60 border-b border-brand-border">
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-secondary">
          Preview Slip Pembayaran
        </p>
      </div>
      <div className="p-2">{renderPaymentDetailsContent()}</div>
    </div>

    {/* Payment form */}
    <div className="bg-brand-bg border border-brand-border rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-widest text-brand-text-secondary">
          Detail Pembayaran
        </p>
        {/* Installment toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-xs text-brand-text-secondary">Bayar Bertahap?</span>
          <button
            type="button"
            role="switch"
            aria-checked={isInstallment}
            onClick={() => setIsInstallment(!isInstallment)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              isInstallment ? 'bg-brand-accent' : 'bg-brand-border'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                isInstallment ? 'translate-x-4' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Amount */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-brand-text-secondary">
            Jumlah Bayar
            <span className="text-brand-text-secondary/60 font-normal ml-1">
              (Tagihan: {formatCurrency(paymentDetails.total)})
            </span>
          </label>
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) =>
              setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))
            }
            max={paymentDetails.total}
            placeholder={String(paymentDetails.total)}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-brand-border bg-brand-surface text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600/60 transition-all"
          />
        </div>

        {/* Source */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-brand-text-secondary">Sumber Dana</label>
          <select
            value={paymentSourceId}
            onChange={(e) => setPaymentSourceId(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-brand-border bg-brand-surface text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600/40 transition-all"
          >
            <option value="" disabled>
              Pilih sumber dana...
            </option>
            {monthlyBudgetPocket && (
              <option value={`pocket-${monthlyBudgetPocket.id}`}>
                {monthlyBudgetPocket.name} — Saldo: {formatCurrency(monthlyBudgetPocket.amount)}
              </option>
            )}
            {cards.map((card) => (
              <option key={card.id} value={`card-${card.id}`}>
                {card.bankName}{' '}
                {card.lastFourDigits !== 'CASH' ? `**** ${card.lastFourDigits}` : ''} — Saldo:{' '}
                {formatCurrency(card.balance)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-brand-border">
        <button
          type="button"
          onClick={onSign}
          className="button-secondary inline-flex items-center gap-2 text-sm px-4 py-2 w-full sm:w-auto justify-center"
        >
          <PencilIcon className="w-4 h-4" />
          Tanda Tangani Slip
        </button>
        <button
          type="button"
          onClick={onPay}
          disabled={!paymentAmount || !paymentSourceId}
          className="button-primary text-sm px-6 py-2 w-full sm:w-auto disabled:opacity-40"
        >
          Bayar Sekarang &amp; Catat
        </button>
      </div>
    </div>
  </div>
);

export default CreatePaymentTab;
