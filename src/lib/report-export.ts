import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function csvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csvContent = rows.map((row) => row.map(csvCell).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadPdf(filename: string, title: string, subtitle: string, table: {
  head: string[][];
  body: Array<Array<string | number>>;
  foot?: Array<Array<string | number>>;
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const subtitleLines = doc.splitTextToSize(subtitle, 182);
  doc.text(subtitleLines, 14, 26);
  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: 32 + Math.max(0, subtitleLines.length - 1) * 4,
    head: table.head,
    body: table.body.map((row) => row.map(String)),
    foot: table.foot?.map((row) => row.map(String)),
    showFoot: Boolean(table.foot?.length),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    footStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: 'bold' },
    theme: 'striped',
    margin: { left: 14, right: 14 },
  });

  doc.save(filename);
}

export function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
