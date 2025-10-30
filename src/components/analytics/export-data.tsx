"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

interface ExportDataProps {
  formId: string;
  totalResponses: number;
}

export function ExportData({ formId, totalResponses }: ExportDataProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');

  const fields = [
    { id: 'timestamp', label: 'Submission Timestamp', selected: true },
    { id: 'fullname', label: 'Full Name', selected: true },
    { id: 'email', label: 'Email Address', selected: true },
    { id: 'experience', label: 'Experience Level', selected: true },
    { id: 'location', label: 'Preferred Work Location', selected: true },
    { id: 'motivation', label: 'Why do you want to work here?', selected: false },
  ];

  const handleExport = () => {
    // In a real app, this would trigger the actual export
    console.log('Exporting data...', { formId, selectedFields, exportFormat });
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
          <Button onClick={handleExport} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Export {totalResponses} Responses
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}