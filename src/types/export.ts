// src/types/export.ts
export interface ExportColumn {
  /** Header that will appear in CSV/Excel */
  header: string;
  /** Property name in the data objects */
  accessor: string;
}
