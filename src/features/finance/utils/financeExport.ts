import { Transaction, TransactionType } from '../../../types';
import { formatCurrencyCSV } from '../../../utils/currency';
import { downloadCSV } from '../../../utils/export';

export function downloadReportCSV(
    reportTransactions: Transaction[],
    reportFilters: { client: string; dateFrom: string; dateTo: string },
    reportClientOptions: { id: string; name: string }[]
): void {
    const headers = ['ID Transaksi', 'Tanggal', 'Deskripsi', 'Kategori', 'Jumlah', 'Jenis'];
    const data = [...reportTransactions]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(t => [
            t.id,
            new Date(t.date).toLocaleDateString('id-ID'),
            t.description,
            t.category || '-',
            Number(t.amount),
            t.type === TransactionType.INCOME ? 'Pemasukan' : 'Pengeluaran'
        ]);
    const clientName = reportFilters.client === 'all'
        ? 'Semua-Pengantin'
        : (reportClientOptions.find(c => c.id === reportFilters.client)?.name || 'Pengantin').replace(/\s+/g, '-');

    downloadCSV(headers, data, `Laporan-Keuangan-${clientName}-${new Date().toISOString().split('T')[0]}.csv`);
}

export function downloadTransactionsCSV(
    filteredTransactions: Transaction[],
    allTransactions: Transaction[],
    filteredSummary: { income: number; expense: number; net: number }
): void {
    const headers = ['ID Transaksi', 'Tanggal', 'Deskripsi', 'Kategori', 'Jumlah', 'Jumlah (Numerik)', 'Jenis'];
    const data: (string | number)[][] = [...filteredTransactions]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(t => [
            t.id,
            new Date(t.date).toLocaleDateString('id-ID'),
            t.description,
            t.category || '-',
            formatCurrencyCSV(Number(t.amount)),
            Number(t.amount),
            t.type === TransactionType.INCOME ? 'Pemasukan' : 'Pengeluaran'
        ]);

    // Section: Summary for current filter
    data.push(['', '', '', '', '', '', '']);
    data.push(['', '', 'Ringkasan (Filter)', '', '', '', '']);
    data.push(['', '', 'Total Pemasukan (Filter)', '', formatCurrencyCSV(Number(filteredSummary.income)), Number(filteredSummary.income), '']);
    data.push(['', '', 'Total Pengeluaran (Filter)', '', formatCurrencyCSV(Number(filteredSummary.expense)), Number(filteredSummary.expense), '']);
    data.push(['', '', 'Laba/Rugi Bersih (Filter)', '', formatCurrencyCSV(Number(filteredSummary.net)), Number(filteredSummary.net), '']);

    // Section: Summary for all transactions
    const overallIncome = allTransactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const overallExpense = allTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const overallNet = overallIncome - overallExpense;
    data.push(['', '', '', '', '', '', '']);
    data.push(['', '', 'Ringkasan (Semua)', '', '', '', '']);
    data.push(['', '', 'Total Pemasukan (Semua)', '', formatCurrencyCSV(Number(overallIncome)), Number(overallIncome), '']);
    data.push(['', '', 'Total Pengeluaran (Semua)', '', formatCurrencyCSV(Number(overallExpense)), Number(overallExpense), '']);
    data.push(['', '', 'Laba/Rugi Bersih (Semua)', '', formatCurrencyCSV(Number(overallNet)), Number(overallNet), '']);

    const title = 'Pembiayaan/Transaksi';
    const today = new Date().toLocaleDateString('id-ID');
    const preface = [['', `${title} - ${today}`, '', '', '', '', ''], ['', '', '', '', '', '', '']];
    downloadCSV(headers, data, `Transaksi-${new Date().toISOString().split('T')[0]}.csv`, preface);
}

export function downloadProfitReportCSV(
    projectProfitabilityData: any[],
    profitReportFilters: { year: number; month: number }
): void {
    const headers = ['ID Pengantin', 'Nama Pengantin', 'Total Pemasukan', 'Total Biaya Produksi', 'Laba Bersih'];
    const data = projectProfitabilityData.map(d => [
        d!.clientId,
        d!.clientName,
        d!.totalIncome,
        d!.totalCost,
        d!.profit
    ]);
    const period = `${profitReportFilters.month + 1}-${profitReportFilters.year}`;
    downloadCSV(headers, data, `Laporan-Laba-Acara Pernikahan-${period}-${new Date().toISOString().split('T')[0]}.csv`);
}
