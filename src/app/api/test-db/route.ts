import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test basic connection
    const { error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: error,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Connection test failed', 
      details: error,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'
    }, { status: 500 });
  }
}