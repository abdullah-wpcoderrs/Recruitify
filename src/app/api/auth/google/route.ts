import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsAuthUrl } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
  try {
    // For now, let's get the user ID from query params to avoid auth issues
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Generate Google OAuth URL
    const authUrl = getGoogleSheetsAuthUrl(userId);
    
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}