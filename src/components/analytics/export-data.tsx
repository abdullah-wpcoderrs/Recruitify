"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

interface FormField {
  id: string;
  label: string;
  type: string;
}

interface ExportDataProps {
  formId: string;
  totalResponses: number;
  formFields?: FormField[];
}

export function ExportData({ formId, totalResponses, formFields = [] }: ExportDataProps) {
  // Generate fields list from form fields
  const fields = [
    { id: 'timestamp', label: 'Submission Timestamp', selected: true },
    ...formFields.map(field => ({
      id: field.label.toLowerCase().replace(/\s+/g, ''),
      label: field.label,
      selected: true
    }))
  ];

  const [selectedFields, setSelectedFields] = useState<string[]>(
    fields.filter(f => f.selected).map(f => f.id)
  );
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const response = await fetch('/api/forms/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId,
          format: exportFormat,
          selectedFields: selectedFields.length > 0 ? selectedFields : null
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      if (exportFormat === 'csv' || exportFormat === 'xlsx') {
        // Handle file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `form-responses-${formId}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Handle JSON response for other formats
        const data = await response.json();
        console.log('Export data:', data);
        alert('PDF export is not yet implemented. Please use CSV or Excel format.');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="w-5 h-5" />
          <span>Export Responses</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium mb-3">Export Format</h4>
          <div className="flex space-x-4">
            <Button
              variant={exportFormat === 'csv' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setExportFormat('csv')}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button
              variant={exportFormat === 'xlsx' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setExportFormat('xlsx')}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button
              variant={exportFormat === 'pdf' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setExportFormat('pdf')}
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Select Fields to Export</h4>
          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field.id} className="flex items-center space-x-2">
                <Checkbox
                  id={field.id}
                  defaultChecked={field.selected}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedFields([...selectedFields, field.id]);
                    } else {
                      setSelectedFields(selectedFields.filter(id => id !== field.id));
                    }
                  }}
                />
                <label htmlFor={field.id} className="text-sm">
                  {field.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">
              {totalResponses} responses ready for export
            </span>
          </div>
          <Button onClick={handleExport} className="w-full" disabled={isExporting}>
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : `Export ${totalResponses} Responses`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}