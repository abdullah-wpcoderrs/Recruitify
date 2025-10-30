"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Eye, 
  Users, 
  TrendingUp, 
  Calendar,
  Filter,
  MoreVertical,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { ResponseSummary } from "./response-summary";
import { ExportData } from "./export-data";
import { GoogleSheetsIntegration } from "./google-sheets-integration";
import { PageLoader } from "@/components/ui/page-loader";
import { getForm } from "@/lib/database";
import { getFormStats } from "@/lib/analytics";
import { useEffect } from "react";

interface FormAnalyticsProps {
  formId: string;
}

interface FieldAnalytics {
  option?: string;
  value?: string;
  count: number;
  percentage?: number;
  [key: string]: unknown;
}

interface FormField {
  id: string;
  label: string;
  type: string;
  options?: string[];
  responses?: number;
  analytics?: FieldAnalytics[];
  avgLength?: number;
}

interface FormData {
  title: string;
  description?: string;
  google_sheet_url?: string;
  google_sheet_last_sync?: string;
  fields?: FormField[];
}

interface Submission {
  id: string;
  submitted_at: string;
  data: Record<string, unknown>;
}

interface FormStats {
  totalSubmissions: number;
  totalViews: number;
  conversionRate: number;
  completionRate: number;
  avgCompletionTime: string;
  submissionsByDate: Record<string, number>;
  submissions: Submission[];
  submissionsGrowth: number;
  viewsGrowth: number;
  conversionGrowth: number;
  completionTimeGrowth: number;
  dropOffPoints: Array<{ fieldName: string; dropOffRate: number }>;
}

interface TrendData {
  date: string;
  submissions: number;
}

const COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'];

// Calculate submission trend from submissions
const calculateSubmissionTrend = (submissions: Submission[]): TrendData[] => {
  if (!submissions || submissions.length === 0) {
    return [];
  }

  // Group submissions by date
  const submissionsByDate: Record<string, number> = {};
  
  submissions.forEach(sub => {
    if (sub.submitted_at) {
      const date = new Date(sub.submitted_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      submissionsByDate[date] = (submissionsByDate[date] || 0) + 1;
    }
  });

  // Convert to array format for chart and sort by date
  return Object.entries(submissionsByDate)
    .map(([date, submissions]) => ({
      date,
      submissions
    }))
    .sort((a, b) => new Date(a.date + ', 2024').getTime() - new Date(b.date + ', 2024').getTime());
};

// Calculate field analytics from submissions
const calculateFieldAnalytics = (field: FormField, submissions: Submission[]): FormField => {
  if (!submissions || submissions.length === 0) {
    return { ...field, responses: 0, analytics: [] };
  }

  // Try multiple ways to match field data
  const possibleKeys = [
    field.label,
    field.id,
    field.label?.toLowerCase(),
    field.label?.replace(/\s+/g, '_'),
    field.label?.replace(/\s+/g, '-')
  ].filter(Boolean);

  let responses = 0;
  let matchingKey = '';

  // Find the key that has the most matches
  for (const key of possibleKeys) {
    const count = submissions.filter(sub => 
      sub.data && 
      sub.data[key] !== undefined && 
      sub.data[key] !== null && 
      sub.data[key] !== ''
    ).length;
    
    if (count > responses) {
      responses = count;
      matchingKey = key;
    }
  }

  console.log(`Field "${field.label}" (${field.type}): ${responses} responses using key "${matchingKey}"`);
  console.log('Available submission keys:', submissions.length > 0 ? Object.keys(submissions[0].data || {}) : 'No submissions');

  if (field.type === 'select' && field.options && matchingKey) {
    // Calculate analytics for select fields
    const optionCounts: Record<string, number> = {};
    
    submissions.forEach(sub => {
      const value = sub.data?.[matchingKey];
      if (value && field.options?.includes(value as string)) {
        optionCounts[value as string] = (optionCounts[value as string] || 0) + 1;
      }
    });

    const analytics = field.options?.map((option: string) => ({
      option,
      count: optionCounts[option] || 0,
      percentage: responses > 0 ? ((optionCounts[option] || 0) / responses) * 100 : 0
    }));

    return { ...field, responses, analytics };
  }

  if (field.type === 'textarea' && matchingKey) {
    // Calculate average length for textarea
    let totalLength = 0;
    let count = 0;
    
    submissions.forEach(sub => {
      const value = sub.data?.[matchingKey];
      if (value && typeof value === 'string') {
        totalLength += value.length;
        count++;
      }
    });

    const avgLength = count > 0 ? Math.round(totalLength / count) : 0;
    return { ...field, responses, avgLength };
  }

  return { ...field, responses };
};

export function FormAnalytics({ formId }: FormAnalyticsProps) {
  const [timeRange, setTimeRange] = useState("7d");
  const [form, setForm] = useState<FormData | null>(null);
  const [stats, setStats] = useState<FormStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submissionTrend, setSubmissionTrend] = useState<TrendData[]>([]);

  const loadFormData = useCallback(async () => {
      try {
        const [formResult, statsResult] = await Promise.all([
          getForm(formId),
          getFormStats(formId)
        ]);
        
        if (formResult.error || !formResult.data) {
          console.error('Error loading form:', formResult.error);
          setForm(null);
        } else {
          // Process form data from database
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawFormData = formResult.data as any;
          const submissions = statsResult?.submissions || [];
          
          // Extract fields from the database structure
          let fields: FormField[] = [];
          if (rawFormData.fields && Array.isArray(rawFormData.fields)) {
            fields = rawFormData.fields;
          }
          
          // Calculate analytics for each field
          const processedFields = fields.map((field: FormField) => 
            calculateFieldAnalytics(field, submissions)
          );
          
          // Create properly structured form data
          const formData: FormData = {
            title: rawFormData.title,
            description: rawFormData.description,
            google_sheet_url: rawFormData.google_sheet_url,
            google_sheet_last_sync: rawFormData.google_sheet_last_sync,
            fields: processedFields
          };
          
          setForm(formData);
          
          // Calculate submission trend data
          const trendData = calculateSubmissionTrend(submissions);
          setSubmissionTrend(trendData);
        }
        
        setStats(statsResult);
      } catch (error) {
        console.error('Error loading form analytics:', error);
        setForm(null);
      } finally {
        setLoading(false);
      }
  }, [formId]);

  useEffect(() => {
    loadFormData();
  }, [loadFormData]);

  const renderFieldAnalytics = (field: FormField) => {
    if (!field) return null;

    // Render select fields with pie chart
    if (field.type === 'select') {
      const hasAnalytics = field.analytics && Array.isArray(field.analytics) && field.analytics.length > 0;
      
      return (
        <Card key={field.id}>
          <CardHeader>
            <CardTitle className="text-lg">{field.label}</CardTitle>
            <p className="text-sm text-gray-600">{field.responses || 0} responses</p>
          </CardHeader>
          <CardContent>
            {hasAnalytics ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={field.analytics}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {field.analytics?.map((entry, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {field.analytics?.map((item, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm">{item.option}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{item.count}</div>
                        <div className="text-xs text-gray-500">{item.percentage?.toFixed(1) || 0}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No responses yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }
    
    // Render textarea fields with character count
    if (field.type === 'textarea') {
      return (
        <Card key={field.id}>
          <CardHeader>
            <CardTitle className="text-lg">{field.label}</CardTitle>
            <p className="text-sm text-gray-600">{field.responses || 0} responses</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-primary-600">{field.responses || 0}</div>
                <div className="text-sm text-gray-600">Total Responses</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-primary-600">{field.avgLength || 0}</div>
                <div className="text-sm text-gray-600">Avg. Characters</div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    // Render all other field types (text, email, etc.)
    return (
      <Card key={field.id}>
        <CardHeader>
          <CardTitle className="text-lg">{field.label}</CardTitle>
          <p className="text-sm text-gray-600">{field.responses || 0} responses • {field.type}</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Text responses collected</p>
            <p className="text-2xl font-bold text-primary-600 mt-2">{field.responses || 0}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <PageLoader message="Loading form analytics..." />;
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Form Not Found</h2>
          <p className="text-gray-600 mb-4">The form you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <span className="text-xl font-bold text-primary-600">Recruitify</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {form.title}
                </h1>
                <p className="text-sm text-gray-600">Form Analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="text-sm border border-gray-100 rounded px-3 py-2"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="responses">Question Analysis</TabsTrigger>
            <TabsTrigger value="individual">Individual Responses</TabsTrigger>
            <TabsTrigger value="sheets">Google Sheets</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Response Summary */}
            <ResponseSummary
              totalResponses={stats?.totalSubmissions || 0}
              completionRate={stats?.completionRate || 0}
              avgTimeToComplete={stats?.avgCompletionTime || "N/A"}
              dropOffPoints={stats?.dropOffPoints || []}
            />

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary-600">
                    {(stats?.totalViews || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-600">
                    {stats?.viewsGrowth !== undefined ? 
                      `${stats.viewsGrowth >= 0 ? '+' : ''}${stats.viewsGrowth}% from last week` :
                      'No data yet'
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Submissions</CardTitle>
                  <Users className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary-600">
                    {stats?.totalSubmissions || 0}
                  </div>
                  <p className="text-xs text-gray-600">
                    {stats?.submissionsGrowth !== undefined ? 
                      `${stats.submissionsGrowth >= 0 ? '+' : ''}${stats.submissionsGrowth}% from last week` :
                      'No submissions yet'
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary-600">
                    {`${stats?.conversionRate || 0}%`}
                  </div>
                  <p className="text-xs text-gray-600">
                    {stats?.conversionGrowth !== undefined ? 
                      `${stats.conversionGrowth >= 0 ? '+' : ''}${stats.conversionGrowth}% from last week` :
                      'Based on current data'
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
                  <Calendar className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary-600">
                    {stats?.avgCompletionTime || "N/A"}
                  </div>
                  <p className="text-xs text-gray-600">
                    {stats?.completionTimeGrowth !== undefined ? 
                      `${stats.completionTimeGrowth >= 0 ? '+' : ''}${stats.completionTimeGrowth}s from last week` :
                      'No data yet'
                    }
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Google Sheets Quick Status */}
            {form.google_sheet_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Google Sheets Integration</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">Connected</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{form.title}</p>
                      <p className="text-xs text-gray-500">{stats?.totalSubmissions || 0} rows synced</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(form.google_sheet_url, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Sheet
                      </Button>
                      <Link href="#sheets">
                        <Button variant="ghost" size="sm">
                          Manage
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submission Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Submission Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={submissionTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="submissions" 
                      stroke="#16a34a" 
                      strokeWidth={2}
                      dot={{ fill: '#16a34a' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="responses" className="space-y-6">
            <div className="space-y-6">
              {form.fields && form.fields.length > 0 ? (
                form.fields.map(renderFieldAnalytics)
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No field data available</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="individual" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Individual Responses</CardTitle>
                      <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {stats?.submissions && stats.submissions.length > 0 ? (
                      <div className="space-y-4">
                        {stats.submissions.map((submission, index: number) => (
                          <div key={submission.id} className="border border-gray-100 rounded p-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-sm font-medium">Response #{index + 1}</div>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{new Date(submission.submitted_at).toLocaleDateString()}</span>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {Object.entries(submission.data || {}).map(([key, value]) => {
                                // Find the field label for this key
                                const field = form?.fields?.find(f => f.id === key || f.label === key);
                                const fieldLabel = field?.label || key;
                                
                                // Handle file uploads - show download links instead of [object Object]
                                let displayValue: React.ReactNode = String(value);
                                if (typeof value === 'object' && value !== null) {
                                  if (Array.isArray(value)) {
                                    // Handle file arrays
                                    const fileLinks = value.map((item: any, idx: number) => {
                                      if (typeof item === 'object' && item.url) {
                                        return (
                                          <a 
                                            key={idx}
                                            href={item.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 underline"
                                          >
                                            📎 {item.name || `File ${idx + 1}`}
                                          </a>
                                        );
                                      }
                                      return String(item);
                                    });
                                    displayValue = <div className="flex flex-wrap gap-2">{fileLinks}</div>;
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  } else if ((value as any).url) {
                                    // Handle single file object
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const fileItem = value as any;
                                    displayValue = (
                                      <a 
                                        href={fileItem.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 underline"
                                      >
                                        📎 {fileItem.name || 'File'}
                                      </a>
                                    );
                                  } else {
                                    displayValue = JSON.stringify(value);
                                  }
                                }
                                
                                return (
                                  <div key={key}>
                                    <span className="font-medium">{fieldLabel}:</span>{' '}
                                    {displayValue}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No submissions yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div>
                <ExportData 
                  formId={formId} 
                  totalResponses={stats?.totalSubmissions || 0}
                  formFields={form?.fields || []}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sheets" className="space-y-6">
            <GoogleSheetsIntegration
              formId={formId}
              isConnected={!!form.google_sheet_url}
              sheetUrl={form.google_sheet_url || ""}
              sheetName={form.title}
              lastSync={form.google_sheet_last_sync || "Never"}
              totalRows={stats?.totalSubmissions || 0}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}