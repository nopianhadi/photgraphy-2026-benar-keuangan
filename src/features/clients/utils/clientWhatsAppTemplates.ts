import { Project, Transaction, TransactionType } from '../../../types';
import { formatCurrency } from './clientHelpers';

export const generateInvoiceWhatsAppMessage = (
    clientName: string,
    companyName: string,
    project: Project,
    publicInvoiceUrl: string
): string => {
    const firstName = clientName.split(' ')[0];
    const sisa = project.totalCost - project.amountPaid;
    return (
        `Halo *${firstName}*! 👋\n\n` +
        `Berikut kami kirimkan *Invoice* untuk Acara Pernikahan Anda bersama *${companyName}* 💍\n\n` +
        `📋 *Detail Tagihan:*\n` +
        `• Acara: ${project.projectName}\n` +
        `• Total Biaya: *${formatCurrency(project.totalCost)}*\n` +
        `• Sudah Dibayar: ${formatCurrency(project.amountPaid)}\n` +
        `• Sisa Tagihan: *${formatCurrency(sisa)}*\n\n` +
        `📄 *Lihat & Download Invoice PDF di sini:*\n${publicInvoiceUrl}\n\n` +
        `_(File PDF invoice juga telah kami kirimkan terpisah)_\n\n` +
        `Terima kasih atas kepercayaan Anda. Semoga acaranya berjalan lancar! 🙏`
    );
};

export const generateReceiptWhatsAppMessage = (
    clientName: string,
    companyName: string,
    transaction: Transaction,
    projectName: string,
    publicReceiptUrl: string
): string => {
    const isExpense = transaction.type === TransactionType.EXPENSE;
    const txDate = new Date(transaction.date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    if (isExpense) {
        let targetName = 'Pihak Lain';
        if (transaction.category === 'Gaji Tim / Vendor') {
            const match = transaction.description?.match(/Gaji Freelance - (.+?) \(/);
            targetName = match && match[1] ? match[1] : 'Vendor / Tim';
        }
        return (
            `Halo *${targetName}*! 👋\n\n` +
            `Berikut kami kirimkan *Bukti Pengeluaran / Slip Pembayaran* dari *${companyName}* ✅\n\n` +
            `📋 *Detail Pembayaran:*\n` +
            `• Tanggal: ${txDate}\n` +
            `• Jumlah: *${formatCurrency(transaction.amount)}*\n` +
            `• Metode: ${transaction.method}\n` +
            `• Keterangan: ${transaction.description}\n\n` +
            `📄 *Lihat & Download Slip PDF di sini:*\n${publicReceiptUrl}\n\n` +
            `_(File PDF slip pembayaran juga telah kami kirimkan terpisah)_\n\n` +
            `Terima kasih! 🙏`
        );
    }

    const firstName = clientName.split(' ')[0];
    return (
        `Halo *${firstName}*! 👋\n\n` +
        `Berikut kami kirimkan *Tanda Terima Pembayaran* untuk Acara Pernikahan Anda bersama *${companyName}* ✅\n\n` +
        `📋 *Detail Pembayaran:*\n` +
        `• Acara: ${projectName}\n` +
        `• Tanggal: ${txDate}\n` +
        `• Jumlah: *${formatCurrency(transaction.amount)}*\n` +
        `• Metode: ${transaction.method}\n` +
        `• Keterangan: ${transaction.description}\n\n` +
        `📄 *Lihat & Download Tanda Terima PDF di sini:*\n${publicReceiptUrl}\n\n` +
        `_(File PDF tanda terima juga telah kami kirimkan terpisah)_\n\n` +
        `Terima kasih, pembayaran Anda telah kami terima dengan baik. Semoga persiapannya lancar! 🙏`
    );
};

export const generatePortalWhatsAppMessage = (
    clientName: string,
    companyName: string,
    portalUrl: string
): string => {
    const firstName = (clientName || '').split(' ')[0];
    return (
        `Halo ${firstName}! 👋\n\n` +
        `Salam dari tim *${companyName}* 💍\n\n` +
        `Kami dengan senang hati membagikan *Portal Pengantin* Anda, di mana Anda bisa memantau:\n` +
        `✅ Progres persiapan acara pernikahan Anda\n` +
        `💰 Detail pembayaran & invoice\n` +
        `📋 Package & vendor yang dipilih\n\n` +
        `🔗 *Akses Portal Anda di sini:*\n${portalUrl}\n\n` +
        `Jika ada pertanyaan, jangan ragu menghubungi kami. Semoga membantu! 🙏`
    );
};
