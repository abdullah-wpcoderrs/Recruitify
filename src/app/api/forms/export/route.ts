import { NextRequest, NextResponse } from 'next/server';
import { getFormSubmissions } from '@/lib/database';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const { formId, format, selectedFields } = await request.json();

    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 });
    }

    // Get form submissions
    const { data: submissions, error } = await getFormSubmissions(formId);
    
    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ error: 'No submissions found' }, { status: 404 });
    }

    // Process submissions data
    const processedData = submissions.map((submission: any) => {
      const row: any = {};
      
      // Add timestamp if selected
      if (!selectedFields || selectedFields.includes('timestamp')) {
        row['Submission Timestamp'] = new Date(submission.submitted_at).toLocaleString();
      }

      // Add form data fields
      if (submission.data) {
        Object.entries(submission.data).forEach(([key, value]) => {
          if (!selectedFields || selectedFields.includes(key.toLowerCase().replace(/\s+/g, ''))) {
            row[key] = value;
          }
        });
      }

      return row;
    });

    if (format === 'csv') {
      // Generate CSV manually
      const headers = Object.keys(processedData[0] || {});
      
      // Create CSV content
      const csvRows = [
        headers.join(','), // Header row
        ...processedData.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma or quote
            const stringValue = String(value || '');
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',')
        )
      ];
      
      const csvContent = csvRows.join('\n');
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="form-responses-${formId}.csv"`
        }
      });
    }

    if (format === 'xlsx') {
      // Generate Excel file
      const worksheet = XLSX.utils.json_to_sheet(processedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Form Responses');
      
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="form-responses-${formId}.xlsx"`
        }
      });
    }

    if (format === 'json') {
      return NextResponse.json({
        data: processedData,
        total: processedData.length,
        exported_at: new Date().toISOString()
      });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}