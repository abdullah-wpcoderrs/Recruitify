import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { formId, metadata } = await request.json();

    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 });
    }

    // Get client IP and user agent
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Insert view record
    const viewRecord = {
      form_id: formId,
      ip_address: ip,
      user_agent: userAgent,
      referrer: metadata?.referrer,
      session_id: metadata?.sessionId,
    };
    
    const { error } = await supabase
      .from('form_views')
      .insert(viewRecord as never);

    if (error) {
      console.error('Error tracking form view:', error);
      return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing view tracking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}