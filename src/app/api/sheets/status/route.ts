import { NextRequest, NextResponse } from 'next/server';
import { hasGoogleSheetsAccess, getSpreadsheetInfo } from '@/lib/google-sheets';
import { getForm } from '@/lib/database';
import { supabase } from '@/lib/supabase';

interface FormWithSheets {
  google_sheet_id?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');
    const userId = searchParams.get('userId');

    if (!formId || !userId) {
      return NextResponse.json({ error: 'Form ID and User ID are required' }, { status: 400 });
    }

    // Check if user has Google Sheets access
    console.log('Status API: Checking access for user:', userId);
    let hasAccess = await hasGoogleSheetsAccess(userId);
    console.log('Status API: hasAccess result from helper:', hasAccess);
    
    // If helper function fails, try direct database check with service role
    if (!hasAccess) {
      console.log('Status API: Trying direct database check with service role...');
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      
      const { data: profiles, error: dbError } = await supabaseAdmin
        .from('profiles')
        .select('google_access_token')
        .eq('id', userId)
        .limit(1);
      
      const profile = profiles?.[0];
      hasAccess = !dbError && !!profile?.google_access_token;
      console.log('Status API: Direct DB check result:', { 
        hasAccess, 
        hasProfile: !!profile,
        hasToken: !!profile?.google_access_token,
        profilesCount: profiles?.length || 0,
        error: dbError?.message 
      });
    }

    // Get form to check if it has a connected spreadsheet
    const { data: form, error: formError } = await getForm(formId);
    
    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const formData = form as unknown as FormWithSheets;
    let spreadsheetInfo = null;
    if (hasAccess && formData.google_sheet_id) {
      const { info, error: infoError } = await getSpreadsheetInfo(userId, formData.google_sheet_id);
      if (!infoError && info) {
        spreadsheetInfo = info;
      }
    }

    return NextResponse.json({
      hasGoogleAccess: hasAccess,
      isConnected: !!formData.google_sheet_id,
      spreadsheetId: formData.google_sheet_id,
      spreadsheetInfo,
    });
  } catch (error) {
    console.error('Error checking Google Sheets status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}