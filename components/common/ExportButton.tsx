'use client';
import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportButtonProps {
  data: any[];
  filename: string;
  columns: { key: string; label: string }[];
}

export function ExportButton({ data, filename, columns }: ExportButtonProps) {
  const [open, setOpen] = useState(false);

  const exportCSV = () => {
    const header = columns.map(c => c.label).join(',');
    const rows = data.map(row =>
      columns.map(c => {
        const val = row[c.key] ?? '';
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const exportJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const printPDF = () => {
    const header = columns.map(c => `<th style="padding:8px;border:1px solid #ddd;background:#f5f5f5">${c.label}</th>`).join('');
    const rows = data.map(row =>
      `<tr>${columns.map(c => `<td style="padding:8px;border:1px solid #ddd">${row[c.key] ?? ''}</td>`).join('')}</tr>`
    ).join('');

    const html = `
      <html><head><title>${filename}</title>
      <style>body{font-family:Arial,sans-serif;font-size:12px}table{border-collapse:collapse;width:100%}h2{color:#0066A1}</style>
      </head><body>
      <h2>${filename}</h2>
      <p style="color:#666">Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
      <table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table>
      </body></html>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
    setOpen(false);
  };

  if (data.length === 0) return null;

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(!open)}
        className="gap-2 text-xs h-8"
      >
        <Download className="h-3.5 w-3.5" />
        Exportar
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 bg-white rounded-lg shadow-lg border border-gray-100 py-1 w-40">
            <button
              onClick={exportCSV}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              Excel / CSV
            </button>
            <button
              onClick={printPDF}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <FileText className="h-4 w-4 text-red-500" />
              Imprimir PDF
            </button>
            <button
              onClick={exportJSON}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <FileText className="h-4 w-4 text-blue-500" />
              JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}
