import { supabase } from './supabase';

export interface DashboardStats {
  totalForms: number;
  totalSubmissions: number;
  totalViews: number;
  conversionRate: number;
  formsGrowth: number;
  submissionsGrowth: number;
  viewsGrowth: number;
  conversionGrowth: number;
}

export const getDashboardStats = async (userId: string): Promise<DashboardStats> => {
  try {
    // Get total forms for user with views
    const { data: forms, error: formsError } = await supabase
      .from('forms')
      .select('id, created_at, total_views')
      .eq('user_id', userId);

    if (formsError) throw formsError;

    interface FormWithViews {
      id: string;
      created_at: string;
      total_views: number;
    }

    const totalForms = forms?.length || 0;
    const totalViews = forms?.reduce((sum, form: FormWithViews) => sum + (form.total_views || 0), 0) || 0;

    // Get total submissions for user's forms
    const formIds = forms?.map((form: FormWithViews) => form.id) || [];
    
    interface Submission {
      id: string;
      submitted_at: string;
    }

    let totalSubmissions = 0;
    let submissions: Submission[] = [];
    if (formIds.length > 0) {
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('form_submissions')
        .select('id, submitted_at')
        .in('form_id', formIds);

      if (submissionsError) throw submissionsError;
      submissions = (submissionsData as Submission[]) || [];
      totalSubmissions = submissions.length;
    }

    // Calculate growth metrics (comparing last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Forms growth
    const recentForms = forms?.filter((form: FormWithViews) => 
      new Date(form.created_at) >= thirtyDaysAgo
    ).length || 0;
    
    const previousForms = forms?.filter((form: FormWithViews) => {
      const createdAt = new Date(form.created_at);
      return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
    }).length || 0;

    const formsGrowth = previousForms > 0 
      ? ((recentForms - previousForms) / previousForms) * 100 
      : recentForms > 0 ? 100 : 0;

    // Submissions growth
    const recentSubmissions = submissions.filter(s => 
      new Date(s.submitted_at) >= thirtyDaysAgo
    ).length;
    
    const previousSubmissions = submissions.filter(s => {
      const submittedAt = new Date(s.submitted_at);
      return submittedAt >= sixtyDaysAgo && submittedAt < thirtyDaysAgo;
    }).length;

    const submissionsGrowth = previousSubmissions > 0 
      ? ((recentSubmissions - previousSubmissions) / previousSubmissions) * 100 
      : recentSubmissions > 0 ? 100 : 0;

    // Calculate conversion rate
    const conversionRate = totalViews > 0 ? (totalSubmissions / totalViews) * 100 : 0;

    return {
      totalForms,
      totalSubmissions,
      totalViews,
      conversionRate: Math.round(conversionRate * 10) / 10,
      formsGrowth: Math.round(formsGrowth * 10) / 10,
      submissionsGrowth: Math.round(submissionsGrowth * 10) / 10,
      viewsGrowth: 0, // Would need historical view data
      conversionGrowth: 0, // Would need historical conversion data
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalForms: 0,
      totalSubmissions: 0,
      totalViews: 0,
      conversionRate: 0,
      formsGrowth: 0,
      submissionsGrowth: 0,
      viewsGrowth: 0,
      conversionGrowth: 0,
    };
  }
};

export const getFormStats = async (formId: string) => {
  try {
    // Get form data including views
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('total_views')
      .eq('id', formId)
      .single();

    if (formError) throw formError;

    // Get form submissions
    const { data: submissions, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('form_id', formId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    interface FormWithTotalViews {
      total_views: number;
    }

    interface SubmissionWithTime {
      submitted_at: string;
      completion_time_seconds?: number | null;
    }

    const totalSubmissions = submissions?.length || 0;
    const totalViews = (form as unknown as FormWithTotalViews)?.total_views || 0;
    
    // Calculate submissions by date for trends
    const submissionsByDate = submissions?.reduce((acc: Record<string, number>, submission: SubmissionWithTime) => {
      const date = new Date(submission.submitted_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {}) || {};

    // Calculate conversion rate
    const conversionRate = totalViews > 0 ? (totalSubmissions / totalViews) * 100 : 0;

    // Calculate average completion time
    const completionTimes = submissions?.filter((s: SubmissionWithTime) => s.completion_time_seconds && s.completion_time_seconds > 0).map((s: SubmissionWithTime) => s.completion_time_seconds as number) || [];
    const avgCompletionSeconds = completionTimes.length > 0 
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length 
      : 0;
    
    const avgCompletionTime = avgCompletionSeconds > 0 
      ? `${Math.floor(avgCompletionSeconds / 60)}m ${Math.floor(avgCompletionSeconds % 60)}s`
      : "N/A";

    // Calculate completion rate (submissions that have all required fields filled)
    const completionRate = totalSubmissions > 0 ? 100 : 0; // Simplified for now

    // Calculate growth metrics (last 7 days vs previous 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const recentSubmissions = submissions?.filter((s: SubmissionWithTime) => 
      new Date(s.submitted_at) >= sevenDaysAgo
    ).length || 0;
    
    const previousSubmissions = submissions?.filter((s: SubmissionWithTime) => {
      const submittedAt = new Date(s.submitted_at);
      return submittedAt >= fourteenDaysAgo && submittedAt < sevenDaysAgo;
    }).length || 0;

    const submissionsGrowth = previousSubmissions > 0 
      ? ((recentSubmissions - previousSubmissions) / previousSubmissions) * 100 
      : recentSubmissions > 0 ? 100 : 0;

    return {
      totalSubmissions,
      totalViews,
      conversionRate: Math.round(conversionRate * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      avgCompletionTime,
      submissionsByDate,
      submissions: submissions || [],
      submissionsGrowth: Math.round(submissionsGrowth * 10) / 10,
      viewsGrowth: 0, // Would need historical view data
      conversionGrowth: 0, // Would need historical conversion data
      completionTimeGrowth: 0, // Would need historical completion time data
      dropOffPoints: [], // Would need field-level tracking
    };
  } catch (error) {
    console.error('Error fetching form stats:', error);
    return {
      totalSubmissions: 0,
      totalViews: 0,
      conversionRate: 0,
      completionRate: 0,
      avgCompletionTime: "N/A",
      submissionsByDate: {},
      submissions: [],
      submissionsGrowth: 0,
      viewsGrowth: 0,
      conversionGrowth: 0,
      completionTimeGrowth: 0,
      dropOffPoints: [],
    };
  }
};