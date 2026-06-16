// src/lib/export.ts
import { Writable } from 'stream';
import { format as formatCsv } from '@fast-csv/format';
import ExcelJS from 'exceljs';
import type { ExportColumn } from '@/types/export';

/**
 * Export data as CSV and return a Buffer.
 */
export async function exportToCsv(data: any[], columns: ExportColumn[]): Promise<Buffer> {
  const stream = new Writable();
  const chunks: Buffer[] = [];
  stream._write = (chunk, _encoding, callback) => {
    chunks.push(Buffer.from(chunk));
    callback();
  };
  const csvStream = formatCsv({ headers: columns.map(c => c.header) })
    .transform((row: any) => columns.map(c => row[c.accessor]))
    .on('error', err => {
      throw err;
    })
    .pipe(stream);
  for (const row of data) {
    csvStream.write(row);
  }
  csvStream.end();
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
  return Buffer.concat(chunks);
}

/**
 * Export data as Excel (XLSX) and return a Buffer.
 */
export async function exportToXlsx(data: any[], columns: ExportColumn[], sheetName: string = 'Sheet1'): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Add header row
  worksheet.addRow(columns.map(c => c.header));

  // Add data rows
  data.forEach(row => {
    const rowData = columns.map(c => row[c.accessor]);
    worksheet.addRow(rowData);
  });

  // Apply basic styling
  worksheet.eachRow((r, rowNumber) => {
    r.eachCell(cell => {
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    });
    if (rowNumber === 1) {
      r.font = { bold: true };
    }
  });

  return await workbook.xlsx.writeBuffer() as any;
}
