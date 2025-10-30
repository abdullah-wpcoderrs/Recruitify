import { NextRequest, NextResponse } from 'next/server';
import { getFormSubmissions } from '@/lib/database';
import * as XLSX from 'xlsx';

import { getForm } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { formId, format, selectedFields } = await request.json();

    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 });
    }

    // Get form data and submissions
    const [formResult, submissionsResult] = await Promise.all([
      getForm(formId),
      getFormSubmissions(formId)
    ]);

    if (formResult.error || !formResult.data) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const { data: submissions, error } = submissionsResult;
    
    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ error: 'No submissions found' }, { status: 404 });
    }

    // Get form fields for proper header mapping
    const formFields = (formResult.data as Record<string, unknown>)?.fields as Record<string, unknown>[] || [];
    
    // Process submissions data
    const processedData = submissions.map((submission: Record<string, unknown>) => {
      const row: Record<string, unknown> = {};
      
      // Add timestamp if selected
      if (!selectedFields || selectedFields.includes('timestamp')) {
        row['Submission Timestamp'] = new Date(submission.submitted_at as string).toLocaleString();
      }

      // Map form fields to submission data using proper field labels as headers
      if (submission.data && formFields.length > 0) {
        formFields.forEach((field: Record<string, unknown>) => {
          const fieldLabel = field.label as string;
          const fieldId = (field.id as string) || fieldLabel.toLowerCase().replace(/\s+/g, '');
          
          // Check if this field should be included in export
          if (!selectedFields || selectedFields.includes(fieldId as string)) {
            // Try to find the value in submission data using various possible keys
            const submissionData = submission.data as Record<string, unknown>;
            let value = submissionData[fieldLabel] || 
                       submissionData[fieldId] || 
                       submissionData[field.name as string] ||
                       submissionData[fieldLabel.toLowerCase()] ||
                       submissionData[fieldLabel.toLowerCase().replace(/\s+/g, '')] ||
                       '';
            
            // Handle file uploads - convert to download URLs
            if (typeof value === 'object' && value !== null) {
              if (Array.isArray(value)) {
                // Handle file arrays
                value = value.map((item: any) => {
                  if (typeof item === 'object' && item.url) {
                    return item.url;
                  }
                  return String(item);
                }).join(', ');
              } else if ((value as any).url) {
                // Handle single file object
                value = (value as any).url;
              } else {
                value = JSON.stringify(value);
              }
            }
            
            // Use the original field label as the column header
            row[fieldLabel] = value;
          }
        });
      } else if (submission.data) {
        // Fallback: use submission data keys directly if no form fields available
        Object.entries(submission.data).forEach(([key, value]) => {
          if (!selectedFields || selectedFields.includes(key.toLowerCase().replace(/\s+/g, ''))) {
            // Handle file uploads in fallback case too
            if (typeof value === 'object' && value !== null) {
              if (Array.isArray(value)) {
                value = value.map((item: any) => {
                  if (typeof item === 'object' && item.url) {
                    return item.url;
                  }
                  return String(item);
                }).join(', ');
              } else if ((value as any).url) {
                value = (value as any).url;
              } else {
                value = JSON.stringify(value);
              }
            }
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