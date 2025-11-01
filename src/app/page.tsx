"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Users, BarChart3, Grid3X3, List, MoreVertical, Eye, Edit, Trash2, LogOut, User, Settings } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/contexts/auth-context";
import { getUserForms, deleteForm } from "@/lib/database";
import { getDashboardStats, DashboardStats, getFormStats } from "@/lib/analytics";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Copy, ExternalLink } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useRouter } from "next/navigation";

interface FormItem {
  id: string;
  title: string;
  description?: string;
  is_published: boolean;
  created_at: string;
  updated_at?: string;
  total_views?: number;
  fields?: unknown[];
  custom_slug?: string;
}

interface FormAnalytics {
  totalSubmissions: number;
  totalViews: number;
  conversionRate: number;
}

function DashboardContent() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [forms, setForms] = useState<FormItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [formAnalytics, setFormAnalytics] = useState<Record<string, FormAnalytics>>({});
  const [loading, setLoading] = useState(true);
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; formId: string; formTitle: string }>({
    isOpen: false,
    formId: '',
    formTitle: ''
  });
  const { user, signOut } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const success = searchParams.get('success');
  const error = searchParams.get('error');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Form URL copied to clipboard!');
  };

  const getPublicUrl = (form: FormItem) => {
    const slug = form.custom_slug || form.id;
    return `${window.location.origin}/forms/${slug}`;
  };

  const openDeleteDialog = (formId: string, formTitle: string) => {
    setDeleteDialog({ isOpen: true, formId, formTitle });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, formId: '', formTitle: '' });
  };

  const handleDeleteForm = async () => {
    const { formId } = deleteDialog;
    setDeletingFormId(formId);
    
    try {
      const { error } = await deleteForm(formId);
      
      if (error) {
        console.error('Error deleting form:', error);
        toast.error('Failed to delete form. Please try again.');
      } else {
        toast.success('Form deleted successfully');
        // Remove the form from the local state
        setForms(forms.filter(form => form.id !== formId));
        // Remove from analytics
        const updatedAnalytics = { ...formAnalytics };
        delete updatedAnalytics[formId];
        setFormAnalytics(updatedAnalytics);
        // Refresh stats
        if (user) {
          const statsResult = await getDashboardStats(user.id);
          setStats(statsResult);
        }
        closeDeleteDialog();
      }
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error('Failed to delete form. Please try again.');
    } finally {
      setDeletingFormId(null);
    }
  };

  const handleFormCardClick = (formId: string, e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons, links, or interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('a') || 
      target.closest('[role="button"]') ||
      target.closest('[data-dropdown-trigger]') ||
      target.closest('[data-dropdown-menu]')
    ) {
      e.stopPropagation();
      return;
    }
    router.push(`/analytics/${formId}`);
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      
      try {
        // Load forms and stats in parallel
        const [formsResult, statsResult] = await Promise.all([
          getUserForms(user.id),
          getDashboardStats(user.id)
        ]);
        
        if (formsResult.error) {
          console.error('Error loading forms:', formsResult.error);
        } else {
          const formsData = formsResult.data || [];
          setForms(formsData);
          
          // Load individual form analytics
          const analyticsPromises = formsData.map(async (form: FormItem) => {
            try {
              const formStats = await getFormStats(form.id);
              return { formId: form.id, stats: formStats };
            } catch (error) {
              console.error(`Error loading stats for form ${form.id}:`, error);
              return { formId: form.id, stats: null };
            }
          });
          
          const analyticsResults = await Promise.all(analyticsPromises);
          const analyticsMap: Record<string, FormAnalytics> = {};
          
          analyticsResults.forEach(({ formId, stats }) => {
            if (stats) {
              analyticsMap[formId] = stats;
            }
          });
          
          setFormAnalytics(analyticsMap);
        }
        
        setStats(statsResult);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-primary-600">Recruitify</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Link href="/builder">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Form
                </Button>
              </Link>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success === 'google_connected' && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Google Sheets connected successfully! You can now create and sync spreadsheets.
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error === 'token_exchange_failed' && 'Failed to connect Google account. Please try again.'}
              {error === 'callback_failed' && 'Google authentication failed. Please try again.'}
              {error === 'missing_parameters' && 'Invalid authentication response from Google.'}
              {!['token_exchange_failed', 'callback_failed', 'missing_parameters'].includes(error) && 
                'An error occurred. Please try again.'}
            </AlertDescription>
          </Alert>
        )}
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
              <FileText className="h-4 w-4 text-primary-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary-600">
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  stats?.totalForms || 0
                )}
              </div>
              <p className="text-xs text-gray-600">
                {loading ? (
                  <div className="h-3 w-32 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : stats?.formsGrowth !== undefined ? (
                  `${stats.formsGrowth >= 0 ? '+' : ''}${stats.formsGrowth}% from last month`
                ) : (
                  'No data yet'
                )}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <Users className="h-4 w-4 text-primary-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary-600">
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  stats?.totalSubmissions || 0
                )}
              </div>
              <p className="text-xs text-gray-600">
                {loading ? (
                  <div className="h-3 w-32 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : stats?.submissionsGrowth !== undefined ? (
                  `${stats.submissionsGrowth >= 0 ? '+' : ''}${stats.submissionsGrowth}% from last month`
                ) : (
                  'No submissions yet'
                )}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary-600">
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  `${stats?.conversionRate || 0}%`
                )}
              </div>
              <p className="text-xs text-gray-600">
                {loading ? (
                  <div className="h-3 w-32 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : stats?.conversionGrowth !== undefined ? (
                  `${stats.conversionGrowth >= 0 ? '+' : ''}${stats.conversionGrowth}% from last month`
                ) : (
                  'Based on current data'
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Forms Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Forms</CardTitle>
                <CardDescription>
                  Manage and analyze your job application forms
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center border border-gray-100 rounded p-1">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 px-3"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 px-3"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto text-primary-600 animate-spin mb-4" />
                <p className="text-gray-600">Loading forms...</p>
              </div>
            ) : forms.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
                <p className="text-gray-600 mb-6">Create your first form to get started</p>
                <Link href="/builder">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Form
                  </Button>
                </Link>
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-4">
                {forms.map((form) => (
                  <div 
                    key={form.id} 
                    className="flex items-center justify-between p-4 border border-gray-100 rounded bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={(e) => handleFormCardClick(form.id, e)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary-100 rounded flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{form.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>
                            {formAnalytics[form.id] ? 
                              `${formAnalytics[form.id].totalSubmissions || 0} submissions` : 
                              <div className="h-4 w-16 bg-gray-200 animate-pulse rounded inline-block"></div>
                            }
                          </span>
                          <span>
                            {formAnalytics[form.id] ? 
                              `${formAnalytics[form.id].totalViews || 0} views` : 
                              <div className="h-4 w-12 bg-gray-200 animate-pulse rounded inline-block"></div>
                            }
                          </span>
                          <span>Created {new Date(form.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        form.is_published 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {form.is_published ? 'Published' : 'Draft'}
                      </span>
                      <Link href={`/builder?edit=${form.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      {form.is_published && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(getPublicUrl(form));
                          }}
                          title="Copy public form URL"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      )}
                      <Link href={`/analytics/${form.id}`}>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analytics
                        </Button>
                      </Link>
                      <DropdownMenu
                        trigger={
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={deletingFormId === form.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            type="button"
                          >
                            {deletingFormId === form.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <MoreVertical className="w-4 h-4" />
                            )}
                          </Button>
                        }
                      >
                        <DropdownMenuItem onClick={() => window.open(getPublicUrl(form), '_blank')}>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview Form
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/builder?edit=${form.id}`)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Form
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/analytics/${form.id}`)}>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Analytics
                        </DropdownMenuItem>
                        {form.is_published && (
                          <DropdownMenuItem onClick={() => copyToClipboard(getPublicUrl(form))}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          variant="destructive"
                          onClick={() => openDeleteDialog(form.id, form.title)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Form
                        </DropdownMenuItem>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forms.map((form) => (
                  <Card 
                    key={form.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={(e) => handleFormCardClick(form.id, e)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 bg-primary-100 rounded flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Preview Form"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(getPublicUrl(form), '_blank');
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Link href={`/builder?edit=${form.id}`}>
                            <Button variant="ghost" size="sm" title="Edit Form">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <DropdownMenu
                            trigger={
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                disabled={deletingFormId === form.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                type="button"
                              >
                                {deletingFormId === form.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="w-4 h-4" />
                                )}
                              </Button>
                            }
                          >
                            <DropdownMenuItem onClick={() => window.open(getPublicUrl(form), '_blank')}>
                              <Eye className="w-4 h-4 mr-2" />
                              Preview Form
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/builder?edit=${form.id}`)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Form
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/analytics/${form.id}`)}>
                              <BarChart3 className="w-4 h-4 mr-2" />
                              View Analytics
                            </DropdownMenuItem>
                            {form.is_published && (
                              <DropdownMenuItem onClick={() => copyToClipboard(getPublicUrl(form))}>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Link
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              variant="destructive"
                              onClick={() => openDeleteDialog(form.id, form.title)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Form
                            </DropdownMenuItem>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div>
                        <CardTitle className="text-lg leading-tight">{form.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">Created {new Date(form.created_at).toLocaleDateString()}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Status</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            form.is_published 
                              ? 'bg-primary-100 text-primary-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {form.is_published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Fields</div>
                            <div className="font-semibold text-primary-600">{form.fields?.length || 0}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Submissions</div>
                            <div className="font-semibold">
                              {formAnalytics[form.id] ? 
                                (formAnalytics[form.id].totalSubmissions || 0) : 
                                <div className="h-4 w-8 bg-gray-200 animate-pulse rounded"></div>
                              }
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Views</div>
                            <div className="font-semibold text-primary-600">
                              {formAnalytics[form.id] ? 
                                (formAnalytics[form.id].totalViews || 0) : 
                                <div className="h-4 w-8 bg-gray-200 animate-pulse rounded"></div>
                              }
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">Conversion</div>
                            <div className="font-semibold">
                              {formAnalytics[form.id] ? 
                                `${formAnalytics[form.id].conversionRate || 0}%` : 
                                <div className="h-4 w-10 bg-gray-200 animate-pulse rounded"></div>
                              }
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          <div className="text-gray-600">Last Updated</div>
                          <div className="font-semibold text-primary-600">{form.updated_at ? new Date(form.updated_at).toLocaleDateString() : 'N/A'}</div>
                        </div>
                        
                        <div className="pt-2 border-t border-gray-100 space-y-2">
                          {form.is_published && (
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(getPublicUrl(form), '_blank');
                                }}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Form
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(getPublicUrl(form));
                                }}
                                title="Copy URL"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                          <Link href={`/analytics/${form.id}`}>
                            <Button className="w-full" size="sm">
                              <BarChart3 className="w-4 h-4 mr-2" />
                              View Analytics
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteForm}
        title="Delete Form"
        message={`Are you sure you want to delete "${deleteDialog.formTitle}"? This action cannot be undone and will permanently remove all form data and submissions.`}
        confirmText="Delete Form"
        cancelText="Cancel"
        variant="destructive"
        loading={deletingFormId === deleteDialog.formId}
      />
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
