import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, storeGoogleTokens } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This contains the user ID
    const error = searchParams.get('error');

    if (error) {
      // User denied access or other OAuth error
      return NextResponse.redirect(
        new URL(`/builder?error=google_auth_denied&message=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/builder?error=google_auth_failed&message=Missing authorization code', request.url)
      );
    }

    // Exchange code for tokens
    const { tokens, error: tokenError } = await exchangeCodeForTokens(code);
    
    if (tokenError || !tokens) {
      console.error('Token exchange error:', tokenError);
      return NextResponse.redirect(
        new URL('/builder?error=google_auth_failed&message=Failed to exchange authorization code', request.url)
      );
    }

    // Store tokens in user profile
    const { error: storeError } = await storeGoogleTokens(state, tokens);
    
    if (storeError) {
      console.error('Token storage error:', storeError);
      return NextResponse.redirect(
        new URL('/builder?error=google_auth_failed&message=Failed to store authentication', request.url)
      );
    }

    // Redirect back to form builder with success
    return NextResponse.redirect(
      new URL('/builder?success=google_connected&message=Google Sheets connected successfully', request.url)
    );
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/builder?error=google_auth_failed&message=Authentication failed', request.url)
    );
  }
}