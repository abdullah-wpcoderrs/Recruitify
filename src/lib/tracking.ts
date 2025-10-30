import { supabase } from './supabase';
import { Json, Database } from '@/types/database';

// Track when someone views a form
export const trackFormView = async (formId: string, metadata?: {
  referrer?: string;
  sessionId?: string;
  userAgent?: string;
}) => {
  try {
    const response = await fetch('/api/forms/track-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formId,
        metadata,
      }),
    });

    if (!response.ok) {
      console.error('Error tracking form view:', await response.text());
    }
  } catch (error) {
    console.error('Error tracking form view:', error);
  }
};

// Track form submission with completion time
export const trackFormSubmission = async (
  formId: string, 
  submissionData: Record<string, unknown>,
  startTime?: number,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  }
) => {
  try {
    const completionTimeSeconds = startTime 
      ? Math.floor((Date.now() - startTime) / 1000)
      : undefined;

    const insertData: Database['public']['Tables']['form_submissions']['Insert'] = {
      form_id: formId,
      data: submissionData as unknown as Json,
      completion_time_seconds: completionTimeSeconds,
      ip_address: metadata?.ipAddress,
      user_agent: metadata?.userAgent,
    };

     
    const { data, error } = await supabase
      .from('form_submissions')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert([insertData] as any)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error tracking form submission:', error);
    return { data: null, error };
  }
};

// Get client-side metadata for tracking
export const getTrackingMetadata = () => {
  if (typeof window === 'undefined') return {};
  
  return {
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    sessionId: getOrCreateSessionId(),
  };
};

// Generate or retrieve session ID for tracking
const getOrCreateSessionId = () => {
  const key = 'recruitify_session_id';
  let sessionId = sessionStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }
  
  return sessionId;
};