import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsAuthUrl } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const formId = searchParams.get('formId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Generate Google OAuth URL with form context
    const authUrl = getGoogleSheetsAuthUrl(userId, formId || undefined);
    
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}