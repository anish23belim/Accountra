// src/app/components/ExportButton.tsx
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useState } from 'react';

interface ExportButtonProps {
  entity: string; // e.g., 'sales', 'purchases'
  filters?: Record<string, string>;
}

export function ExportButton({ entity, filters }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ entity, format });
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          if (v) params.append(k, v);
        });
      }
      const res = await fetch(`/api/export?${params.toString()}`);
      if (!res.ok) {
        const err = await res.text();
        alert(`Export failed: ${err}`);
        setLoading(false);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = res.headers.get('Content-Disposition');
      const filenameMatch = disposition?.match(/filename="?([^\"]+)"?/);
      a.download = filenameMatch ? filenameMatch[1] : `${entity}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Export error');
    }
    setLoading(false);
  };

  return (
    <div className="flex space-x-2">
      <Button variant="outline" disabled={loading} onClick={() => handleExport('csv')}>
        <Download className="mr-2 h-4 w-4" /> Export CSV
      </Button>
      <Button variant="outline" disabled={loading} onClick={() => handleExport('xlsx')}>
        <Download className="mr-2 h-4 w-4" /> Export Excel
      </Button>
    </div>
  );
}
