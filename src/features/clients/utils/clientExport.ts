export const downloadCSV = (headers: string[], data: (string | number)[][], filename: string) => {
    const csvRows = [
        headers.join(','),
        ...data.map(row =>
            row.map(field => {
                const str = String(field);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(',')
        )
    ];

    const csvString = csvRows.join('\n');
    // Add UTF-8 BOM so Excel (Windows) recognizes encoding
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export interface ClientExportItem {
    name: string;
    email: string;
    phone: string;
    status: string;
    totalProjectValue: number | string;
    balanceDue: number | string;
    PackageTerbaru: string;
}

export const exportClientsToCSV = (clientData: ClientExportItem[]) => {
    const headers = ['Nama', 'Email', 'Telepon', 'Status', 'Total Package', 'Sisa Tagihan', 'Package Terbaru'];
    const data = clientData.map(client => [
        `"${client.name.replace(/"/g, '""')}"`,
        client.email,
        client.phone,
        client.status,
        client.totalProjectValue,
        client.balanceDue,
        client.PackageTerbaru
    ]);
    downloadCSV(headers, data, `data-pengantin-${new Date().toISOString().split('T')[0]}.csv`);
};
