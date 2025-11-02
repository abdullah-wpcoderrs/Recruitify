import { NextRequest, NextResponse } from 'next/server';
import { createSubmission, getForm } from '@/lib/database';
import { appendToSpreadsheet } from '@/lib/google-sheets';
import { supabase } from '@/lib/supabase';

interface UploadedFile {
  status: string;
  url?: string;
  name: string;
  size: number;
  type: string;
}

interface FormField {
  id?: string;
  label: string;
}

interface FormData {
  is_published: boolean;
  google_sheet_id?: string;
  user_id?: string;
  fields?: FormField[];
}

interface SubmissionData {
  id: string;
}

export async function POST(request: NextRequest) {
  try {
    const { formId, data, files, completionTimeSeconds } = await request.json();

    if (!formId || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get form to verify it exists and is published
    const { data: form, error: formError } = await getForm(formId);
    
    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const formData = form as unknown as FormData;
    if (!formData.is_published) {
      return NextResponse.json({ error: 'Form is not published' }, { status: 403 });
    }

    // Get client IP and user agent
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create submission in database with completion time
    const { data: submission, error: submissionError } = await createSubmission({
      form_id: formId,
      data,
      completion_time_seconds: completionTimeSeconds,
      ip_address: ip,
      user_agent: userAgent,
    });

    if (submissionError) {
      console.error('Error creating submission:', submissionError);
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
    }

    const submissionData = submission as unknown as SubmissionData;

    // Save file information to database if files were uploaded
    if (files && submissionData?.id) {
      try {
        const fileRecords = [];
        
        for (const [fieldId, fieldFiles] of Object.entries(files)) {
          const uploadedFiles = fieldFiles as UploadedFile[];
          
          for (const file of uploadedFiles) {
            if (file.status === 'completed' && file.url) {
              fileRecords.push({
                form_id: formId,
                submission_id: submissionData.id,
                field_id: fieldId,
                file_name: file.name,
                file_size: file.size,
                file_type: file.type,
                storage_path: file.url.split('/').pop(), // Extract path from URL
                public_url: file.url,
              });
            }
          }
        }

        if (fileRecords.length > 0) {
          const { error: fileError } = await supabase
            .from('form_files')
            .insert(fileRecords as never);

          if (fileError) {
            console.error('Error saving file records:', fileError);
            // Don't fail the submission if file record saving fails
          }
        }
      } catch (error) {
        console.error('Error processing file uploads:', error);
        // Don't fail the submission if file processing fails
      }
    }

    // Sync to Google Sheets if connected
    if (formData.google_sheet_id && formData.user_id && formData.fields) {
      try {
        // Create field mapping from ID to label
        const fieldMap = new Map(
          formData.fields.map((field: { id?: string; label: string }) => [field.id, field.label])
        );
        
        await appendToSpreadsheet(
          formData.user_id, 
          formData.google_sheet_id, 
          data, 
          formData.fields,
          fieldMap
        );
      } catch (error) {
        console.error('Error syncing to Google Sheets:', error);
        // Don't fail the submission if Google Sheets sync fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      submissionId: submissionData?.id 
    });
  } catch (error) {
    console.error('Error processing form submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}