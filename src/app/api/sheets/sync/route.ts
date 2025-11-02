import { NextRequest, NextResponse } from 'next/server';
import { appendToSpreadsheet, getSpreadsheetInfo } from '@/lib/google-sheets';
import { getCurrentUser } from '@/lib/supabase';
import { getForm, getFormSubmissions } from '@/lib/database';

interface FormField {
  label: string;
}

interface FormWithSheets {
  google_sheet_id?: string;
  fields?: FormField[];
}

interface SubmissionData {
  data: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formId } = await request.json();

    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 });
    }

    // Get form and its submissions
    const [formResult, submissionsResult] = await Promise.all([
      getForm(formId),
      getFormSubmissions(formId)
    ]);

    if (formResult.error || !formResult.data) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const form = formResult.data as unknown as FormWithSheets;
    const submissions = submissionsResult.data || [];

    if (!form.google_sheet_id) {
      return NextResponse.json({ error: 'No Google Sheet connected' }, { status: 400 });
    }

    // Get fields from form
    const fields = form.fields || [];

    // Sync all submissions to spreadsheet
    let syncedCount = 0;
    for (const submission of submissions) {
      const submissionData = submission as unknown as SubmissionData;
      const { error } = await appendToSpreadsheet(
        user.id,
        form.google_sheet_id,
        submissionData.data,
        fields
      );
      
      if (!error) {
        syncedCount++;
      }
    }

    // Get updated spreadsheet info
    const { info } = await getSpreadsheetInfo(user.id, form.google_sheet_id);

    return NextResponse.json({ 
      syncedCount,
      totalSubmissions: submissions.length,
      spreadsheetInfo: info
    });
  } catch (error) {
    console.error('Error syncing to spreadsheet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}