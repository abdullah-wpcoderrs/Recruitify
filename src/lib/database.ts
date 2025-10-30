import { supabase } from './supabase';
import { FormField, FormStep, FormDesign, FormSettings } from '@/components/form-builder/form-builder';
import { Json, Database } from '@/types/database';

export interface DatabaseForm {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  steps?: FormStep[];
  design: FormDesign;
  settings: FormSettings;
  is_published: boolean;
  custom_slug?: string;
  google_sheet_id?: string;
  google_sheet_url?: string;
  total_views?: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Forms CRUD operations
export const createForm = async (formData: {
  title: string;
  description?: string;
  fields: FormField[];
  steps?: FormStep[];
  design: FormDesign;
  settings: FormSettings;
  user_id: string;
}) => {
  console.log('Creating form with data:', formData);
  
  const insertData: Database['public']['Tables']['forms']['Insert'] = {
    title: formData.title,
    description: formData.description,
    fields: formData.fields as unknown as Json,
    branding: {
      design: formData.design,
      settings: formData.settings,
      steps: formData.steps,
    } as unknown as Json,
    is_published: false,
    user_id: formData.user_id,
  };

   
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('forms')
    .insert([insertData])
    .select();

  if (error) {
    console.error('Database error:', error);
  } else {
    console.log('Form created successfully:', data);
  }

  return { data: data ? data[0] : null, error };
};

export const updateForm = async (
  formId: string,
  updates: Partial<{
    title: string;
    description: string;
    fields: FormField[];
    steps: FormStep[];
    design: FormDesign;
    settings: FormSettings;
    is_published: boolean;
    google_sheet_id: string;
    google_sheet_url: string;
    custom_slug: string;
  }>
) => {
  const updateData: Record<string, unknown> = {};
  
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.fields !== undefined) updateData.fields = updates.fields as unknown as Json;
  if (updates.is_published !== undefined) updateData.is_published = updates.is_published;
  if (updates.google_sheet_id !== undefined) updateData.google_sheet_id = updates.google_sheet_id;
  if (updates.google_sheet_url !== undefined) updateData.google_sheet_url = updates.google_sheet_url;
  if (updates.custom_slug !== undefined) updateData.custom_slug = updates.custom_slug;
  
  // Handle branding object updates
  if (updates.design || updates.settings || updates.steps) {
    // First get current branding
     
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentForm } = await (supabase as any)
      .from('forms')
      .select('branding')
      .eq('id', formId)
      .single();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentBranding = ((currentForm as any)?.branding as Record<string, unknown>) || {};
    
    updateData.branding = {
      ...currentBranding,
      ...(updates.design && { design: updates.design }),
      ...(updates.settings && { settings: updates.settings }),
      ...(updates.steps && { steps: updates.steps }),
    } as unknown as Json;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('forms')
    .update(updateData)
    .eq('id', formId)
    .select()
    .single();

  return { data, error };
};

export const getUserForms = async (userId: string) => {
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
};

export const getForm = async (formId: string) => {
  // Try to get by custom slug first, then by ID
  let { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('custom_slug', formId)
    .single();

  // If not found by custom slug, try by ID
  if (error || !data) {
    const result = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single();
    
    data = result.data;
    error = result.error;
  }

  return { data, error };
};

export const deleteForm = async (formId: string) => {
  const { error } = await supabase
    .from('forms')
    .delete()
    .eq('id', formId);

  return { error };
};

// Form submissions
export const createSubmission = async (submissionData: {
  form_id: string;
  data: Record<string, unknown>;
  completion_time_seconds?: number;
  ip_address?: string;
  user_agent?: string;
}) => {
  const insertData: Database['public']['Tables']['form_submissions']['Insert'] = {
    form_id: submissionData.form_id,
    data: submissionData.data as unknown as Json,
    completion_time_seconds: submissionData.completion_time_seconds,
    ip_address: submissionData.ip_address,
    user_agent: submissionData.user_agent,
  };

   
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('form_submissions')
    .insert([insertData])
    .select()
    .single();

  return { data, error };
};

export const getFormSubmissions = async (formId: string) => {
  const { data, error } = await supabase
    .from('form_submissions')
    .select('*')
    .eq('form_id', formId)
    .order('submitted_at', { ascending: false });

  return { data, error };
};

// Analytics helpers
export const getFormAnalytics = async (formId: string) => {
  const { data: submissions, error } = await supabase
    .from('form_submissions')
    .select('*')
    .eq('form_id', formId);

  if (error) return { data: null, error };

  // Calculate analytics
  const totalSubmissions = submissions.length;
  const submissionsByDate = submissions.reduce((acc: Record<string, number>, submission: { submitted_at: string }) => {
    const date = new Date(submission.submitted_at).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  return {
    data: {
      totalSubmissions,
      submissionsByDate,
      submissions,
    },
    error: null,
  };
};