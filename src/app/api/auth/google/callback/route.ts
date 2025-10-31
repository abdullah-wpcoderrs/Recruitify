import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, storeGoogleTokens } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This contains user ID and form ID
    const error = searchParams.get('error');

    // Parse state to get userId and formId
    let userId: string;
    let formId: string | null = null;
    
    try {
      const stateData = JSON.parse(state || '{}');
      userId = stateData.userId;
      formId = stateData.formId;
    } catch {
      // Fallback for old format (just userId)
      userId = state || '';
    }

    // Determine redirect URL based on context
    const getRedirectUrl = (params: string) => {
      if (formId) {
        return new URL(`/analytics/${formId}?${params}`, request.url);
      }
      return new URL(`/builder?${params}`, request.url);
    };

    if (error) {
      // User denied access or other OAuth error
      return NextResponse.redirect(
        getRedirectUrl(`error=google_auth_denied&message=${encodeURIComponent(error)}`)
      );
    }

    if (!code || !userId) {
      return NextResponse.redirect(
        getRedirectUrl('error=google_auth_failed&message=Missing authorization code')
      );
    }

    // Exchange code for tokens
    const { tokens, error: tokenError } = await exchangeCodeForTokens(code);
    
    if (tokenError || !tokens) {
      console.error('Token exchange error:', tokenError);
      return NextResponse.redirect(
        getRedirectUrl('error=google_auth_failed&message=Failed to exchange authorization code')
      );
    }

    // Store tokens in user profile
    const { error: storeError } = await storeGoogleTokens(userId, tokens);
    
    if (storeError) {
      console.error('Token storage error:', storeError);
      return NextResponse.redirect(
        getRedirectUrl('error=google_auth_failed&message=Failed to store authentication')
      );
    }

    // Redirect back to appropriate page with success
    return NextResponse.redirect(
      getRedirectUrl('success=google_connected&message=Google Sheets connected successfully')
    );
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/builder?error=google_auth_failed&message=Authentication failed', request.url)
    );
  }
}