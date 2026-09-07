export const downloadCSV = (
    headers: string[],
    data: (string | number | undefined)[][],
    filename: string,
    prefaceRows: (string | number | undefined)[][] = []
) => {
    // Use semicolon as delimiter for locales (like Indonesia) where Excel expects ';'
    const DELIM = ';';
    const normalizeField = (field: string | number | undefined) => {
        const str = String(field ?? '');
        if (str.includes(DELIM) || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };
    const normalizeRow = (row: (string | number | undefined)[]) => row.map(normalizeField).join(DELIM);

    const csvRows = [
        // Excel delimiter hint to ensure proper column splitting
        `sep=${DELIM}`,
        ...prefaceRows.map(normalizeRow),
        headers.map(normalizeField).join(DELIM),
        ...data.map(normalizeRow)
    ];

    const csvString = csvRows.join('\n');
    // Add UTF-8 BOM so Excel (Windows) recognizes encoding and Indonesian characters
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
