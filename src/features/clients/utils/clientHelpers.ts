import { PaymentStatus, ClientType } from '../../../types';

export const formatCurrency = (amount: number) => {
    // Ensure proper Indonesian currency formatting with correct decimal separator
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

export const normalizeTerminology = (text: string): string => {
    if (!text) return text;
    return text
        .replace(/Proyek/g, 'Acara Pernikahan')
        .replace(/DP Proyek/g, 'DP Acara Pernikahan')
        .replace(/Pelunasan Proyek/g, 'Pelunasan Acara Pernikahan')
        .replace(/Pembayaran Proyek/g, 'Pembayaran Acara Pernikahan');
};

export const getPaymentStatusClass = (status: PaymentStatus | null) => {
    if (!status) return 'bg-gray-500/20 text-gray-400';
    switch (status) {
        case PaymentStatus.LUNAS: return 'bg-green-100 text-green-800';
        case PaymentStatus.DP_TERBAYAR: return 'bg-blue-600/20 text-blue-800';
        case PaymentStatus.BELUM_BAYAR: return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-500/20 text-gray-400';
    }
};

export const ensureOnlineOrNotify = (showNotification: (message: string) => void): boolean => {
    if (!navigator.onLine) {
        showNotification('Harus online untuk melakukan perubahan');
        return false;
    }
    return true;
};

export const initialFormState = {
    clientId: '',
    clientName: '',
    email: '',
    phone: '',
    whatsapp: '',
    instagram: '',
    clientType: ClientType.DIRECT,
    projectId: '',
    projectName: '',
    projectType: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    packageId: '',
    selectedAddOnIds: [] as string[],
    durationSelection: '',
    unitPrice: undefined as number | undefined,
    dp: '',
    dpDestinationCardId: '',
    notes: '',
    accommodation: '',
    driveLink: '',
    promoCodeId: '',
    address: '',
};

export const initialClientFormState = initialFormState;
