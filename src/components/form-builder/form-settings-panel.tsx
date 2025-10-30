"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Settings, Mail, BarChart3, Shield, Link, Bell, Copy, ExternalLink, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { FormSettings } from "./form-builder";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useSearchParams } from "next/navigation";

interface FormSettingsPanelProps {
  settings: FormSettings;
  onSettingsChange: (settings: FormSettings) => void;
  formId?: string;
  formFields?: Array<{ label: string }>;
}

interface SpreadsheetInfo {
  id: string;
  title: string;
  rowCount: number;
  lastUpdated: string;
}

interface GoogleSheetsStatus {
  hasAccess: boolean;
  isConnected: boolean;
  spreadsheetInfo: SpreadsheetInfo | null;
  loading: boolean;
}

export function FormSettingsPanel({ settings, onSettingsChange, formId, formFields = [] }: FormSettingsPanelProps) {
  const [googleSheetsStatus, setGoogleSheetsStatus] = useState<GoogleSheetsStatus>({
    hasAccess: false,
    isConnected: false,
    spreadsheetInfo: null,
    loading: true,
  });
  const [showGoogleDialog, setShowGoogleDialog] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const updateSettings = (updates: Partial<FormSettings>) => {
    const newSettings = { ...settings, ...updates };
    onSettingsChange(newSettings);
  };

  // Check Google Sheets status on component mount
  useEffect(() => {
    if (formId && user) {
      checkGoogleSheetsStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, user]);

  // Handle OAuth callback messages
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (success === 'google_connected') {
      toast.success(decodeURIComponent(message || 'Google Sheets connected successfully'));
      checkGoogleSheetsStatus();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error?.startsWith('google_')) {
      toast.error(decodeURIComponent(message || 'Failed to connect Google Sheets'));
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const checkGoogleSheetsStatus = async () => {
    if (!formId || !user) {
      setGoogleSheetsStatus(prev => ({ ...prev, loading: false }));
      return;
    }
    
    try {
      const response = await fetch(`/api/sheets/status?formId=${formId}&userId=${user.id}`);
      
      if (response.status === 401) {
        // User not authenticated, stop loading
        setGoogleSheetsStatus({
          hasAccess: false,
          isConnected: false,
          spreadsheetInfo: null,
          loading: false,
        });
        return;
      }
      
      const data = await response.json();
      
      if (response.ok) {
        setGoogleSheetsStatus({
          hasAccess: data.hasGoogleAccess,
          isConnected: data.isConnected,
          spreadsheetInfo: data.spreadsheetInfo,
          loading: false,
        });
      } else {
        console.error('Error response:', data);
        setGoogleSheetsStatus({
          hasAccess: false,
          isConnected: false,
          spreadsheetInfo: null,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Error checking Google Sheets status:', error);
      setGoogleSheetsStatus({
        hasAccess: false,
        isConnected: false,
        spreadsheetInfo: null,
        loading: false,
      });
    }
  };

  const handleGoogleConnect = async () => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }
    
    try {
      const response = await fetch(`/api/auth/google?userId=${user.id}`);
      const data = await response.json();
      
      if (response.ok && data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        console.error('Auth error:', data);
        toast.error(data.error || 'Failed to initiate Google authentication');
      }
    } catch (error) {
      console.error('Error connecting to Google:', error);
      toast.error('Failed to connect to Google Sheets');
    }
  };

  const handleCreateSpreadsheet = async () => {
    if (!formId) return;
    
    setConnectingGoogle(true);
    try {
      const headers = formFields.map((field) => field.label);
      
      const response = await fetch('/api/sheets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          title: `Form Responses - ${new Date().toLocaleDateString()}`,
          headers,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Spreadsheet created and connected successfully!');
        setShowGoogleDialog(false);
        checkGoogleSheetsStatus();
      } else {
        toast.error(data.error || 'Failed to create spreadsheet');
      }
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      toast.error('Failed to create spreadsheet');
    } finally {
      setConnectingGoogle(false);
    }
  };

  const handleConnectExisting = async () => {
    if (!formId || !spreadsheetUrl.trim()) return;
    
    setConnectingGoogle(true);
    try {
      const headers = formFields.map((field) => field.label);
      
      const response = await fetch('/api/sheets/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          spreadsheetUrl: spreadsheetUrl.trim(),
          headers,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Connected to existing spreadsheet successfully!');
        setShowGoogleDialog(false);
        setSpreadsheetUrl('');
        checkGoogleSheetsStatus();
      } else {
        toast.error(data.error || 'Failed to connect to spreadsheet');
      }
    } catch (error) {
      console.error('Error connecting to spreadsheet:', error);
      toast.error('Failed to connect to spreadsheet');
    } finally {
      setConnectingGoogle(false);
    }
  };

  const handleDisconnect = async () => {
    if (!formId) return;
    
    try {
      const response = await fetch('/api/sheets/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId }),
      });

      if (response.ok) {
        toast.success('Spreadsheet disconnected successfully');
        checkGoogleSheetsStatus();
      } else {
        toast.error('Failed to disconnect spreadsheet');
      }
    } catch (error) {
      console.error('Error disconnecting spreadsheet:', error);
      toast.error('Failed to disconnect spreadsheet');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        {/* URL & Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Link className="w-5 h-5" />
              <span>Form URL & Branding</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="custom-slug">Custom URL Slug (Optional)</Label>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-sm text-gray-500">recruitify.app/forms/</span>
                <Input
                  id="custom-slug"
                  value={settings.customSlug || ''}
                  onChange={(e) => updateSettings({ customSlug: e.target.value })}
                  placeholder="my-custom-form"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Leave empty to use auto-generated ID. Only letters, numbers, and hyphens allowed.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-medium text-sm mb-2">Current Form URL</h4>
              <div className="flex items-center space-x-2">
                <code className="text-sm bg-white px-2 py-1 rounded border flex-1 overflow-x-auto">
                  {typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com'}/forms/{settings.customSlug || formId || 'form-id'}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com'}/forms/${settings.customSlug || formId || 'form-id'}`;
                    navigator.clipboard.writeText(url);
                    toast.success('Form URL copied to clipboard!');
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Behavior */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Form Behavior</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-progress" className="text-base font-medium">
                  Show Progress Bar
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Display progress indicator for multi-step forms
                </p>
              </div>
              <Switch
                id="show-progress"
                checked={settings.showProgressBar}
                onCheckedChange={(checked) => updateSettings({ showProgressBar: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="save-continue" className="text-base font-medium">
                  Allow Save & Continue Later
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Let users save their progress and return later
                </p>
              </div>
              <Switch
                id="save-continue"
                checked={settings.allowSaveAndContinue}
                onCheckedChange={(checked) => updateSettings({ allowSaveAndContinue: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require-all" className="text-base font-medium">
                  Require All Fields
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Make all form fields required by default
                </p>
              </div>
              <Switch
                id="require-all"
                checked={settings.requireAllFields}
                onCheckedChange={(checked) => updateSettings({ requireAllFields: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-numbers" className="text-base font-medium">
                  Show Field Numbers
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Display numbers next to field labels
                </p>
              </div>
              <Switch
                id="show-numbers"
                checked={settings.showFieldNumbers}
                onCheckedChange={(checked) => updateSettings({ showFieldNumbers: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="submit-text">Submit Button Text</Label>
              <Input
                id="submit-text"
                value={settings.submitButtonText}
                onChange={(e) => updateSettings({ submitButtonText: e.target.value })}
                placeholder="Submit Application"
              />
            </div>

            <div>
              <Label htmlFor="success-message">Success Message</Label>
              <Textarea
                id="success-message"
                value={settings.successMessage}
                onChange={(e) => updateSettings({ successMessage: e.target.value })}
                placeholder="Thank you for your application!"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="redirect-url">Redirect URL (Optional)</Label>
              <Input
                id="redirect-url"
                value={settings.redirectUrl || ''}
                onChange={(e) => updateSettings({ redirectUrl: e.target.value })}
                placeholder="https://example.com/thank-you"
              />
              <p className="text-xs text-gray-600 mt-1">
                Redirect users to this URL after successful submission
              </p>
            </div>
          </CardContent>
        </Card>

        {/* File Upload Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>File Upload Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="default-file-types">Default Accepted File Types</Label>
              <Input
                id="default-file-types"
                value={settings.defaultFileTypes || '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png'}
                onChange={(e) => updateSettings({ defaultFileTypes: e.target.value })}
                placeholder=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                Default file types for new file upload fields
              </p>
            </div>
            
            <div>
              <Label htmlFor="default-max-size">Default Maximum File Size (MB)</Label>
              <Input
                id="default-max-size"
                type="number"
                value={settings.defaultMaxFileSize || 10}
                onChange={(e) => updateSettings({ defaultMaxFileSize: parseInt(e.target.value) || 10 })}
                min="1"
                max="100"
                className="mt-2"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Multiple Files by Default</Label>
                <p className="text-sm text-gray-500">New file fields allow multiple uploads</p>
              </div>
              <Switch
                checked={settings.defaultAllowMultiple || false}
                onCheckedChange={(checked) => updateSettings({ defaultAllowMultiple: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Security & Privacy</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="collect-analytics" className="text-base font-medium">
                  Collect Analytics
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Track form views, submissions, and completion rates
                </p>
              </div>
              <Switch
                id="collect-analytics"
                checked={settings.collectAnalytics}
                onCheckedChange={(checked) => updateSettings({ collectAnalytics: checked })}
              />
            </div>

            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-medium text-sm mb-2">Data Collection Notice</h4>
              <p className="text-xs text-gray-600">
                When analytics are enabled, we collect anonymous data about form interactions 
                to help you improve your forms. No personal information is stored.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications" className="text-base font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Get notified when someone submits your form
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSettings({ emailNotifications: checked })}
              />
            </div>

            {settings.emailNotifications && (
              <div>
                <Label htmlFor="notification-email">Notification Email</Label>
                <Input
                  id="notification-email"
                  type="email"
                  value={settings.notificationEmail || ''}
                  onChange={(e) => updateSettings({ notificationEmail: e.target.value })}
                  placeholder="notifications@company.com"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Email address to receive form submission notifications
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Integration Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Link className="w-5 h-5" />
              <span>Integrations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border border-gray-100 rounded">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">G</span>
                  </div>
                  <div>
                    <h4 className="font-medium flex items-center space-x-2">
                      <span>Google Sheets</span>
                      {googleSheetsStatus.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {googleSheetsStatus.isConnected && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {googleSheetsStatus.isConnected 
                        ? 'Connected - submissions sync automatically' 
                        : 'Sync submissions to spreadsheet'
                      }
                    </p>
                  </div>
                </div>
                
                {googleSheetsStatus.isConnected ? (
                  <div className="flex items-center space-x-2">
                    {googleSheetsStatus.spreadsheetInfo && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${googleSheetsStatus.spreadsheetInfo?.id}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleDisconnect}>
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Dialog open={showGoogleDialog} onOpenChange={setShowGoogleDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Connect
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Connect Google Sheets</DialogTitle>
                        <DialogDescription>
                          Connect your form to Google Sheets to automatically sync form submissions to a spreadsheet.
                        </DialogDescription>
                      </DialogHeader>
                      
                      {!googleSheetsStatus.hasAccess ? (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded">
                            <AlertCircle className="w-5 h-5 text-blue-500" />
                            <div>
                              <p className="font-medium text-blue-900">Authorization Required</p>
                              <p className="text-sm text-blue-700">
                                You need to authorize access to your Google Sheets first.
                              </p>
                            </div>
                          </div>
                          
                          <Button onClick={handleGoogleConnect} className="w-full">
                            <span className="text-white font-bold mr-2">G</span>
                            Authorize Google Sheets Access
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <Button 
                              onClick={handleCreateSpreadsheet} 
                              disabled={connectingGoogle}
                              className="w-full"
                            >
                              {connectingGoogle ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Creating...
                                </>
                              ) : (
                                'Create New Spreadsheet'
                              )}
                            </Button>
                            
                            <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                              </div>
                              <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-500">Or</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Input
                                placeholder="Paste Google Sheets URL or ID"
                                value={spreadsheetUrl}
                                onChange={(e) => setSpreadsheetUrl(e.target.value)}
                              />
                              <Button 
                                variant="outline" 
                                onClick={handleConnectExisting}
                                disabled={connectingGoogle || !spreadsheetUrl.trim()}
                                className="w-full"
                              >
                                {connectingGoogle ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Connecting...
                                  </>
                                ) : (
                                  'Connect Existing Spreadsheet'
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>• New spreadsheet will be created in your Google Drive</p>
                            <p>• Existing spreadsheet must be editable by you</p>
                            <p>• Form submissions will sync automatically</p>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              {googleSheetsStatus.isConnected && googleSheetsStatus.spreadsheetInfo && (
                <div className="text-xs text-gray-600 space-y-1">
                  <p>📊 <strong>{googleSheetsStatus.spreadsheetInfo.title}</strong></p>
                  <p>📝 {googleSheetsStatus.spreadsheetInfo.rowCount} rows</p>
                  <p>🔄 Last synced: {new Date(googleSheetsStatus.spreadsheetInfo.lastUpdated).toLocaleString()}</p>
                </div>
              )}
              
              {!googleSheetsStatus.isConnected && (
                <p className="text-xs text-gray-600">
                  Automatically send form submissions to your Google Sheets
                </p>
              )}
            </div>

            <div className="p-4 border border-gray-100 rounded opacity-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Email Marketing</h4>
                    <p className="text-sm text-gray-600">Add to mailing lists</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Coming Soon
                </Button>
              </div>
              <p className="text-xs text-gray-600">
                Automatically add applicants to your email marketing campaigns
              </p>
            </div>

            <div className="p-4 border border-gray-100 rounded opacity-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Analytics Tools</h4>
                    <p className="text-sm text-gray-600">Advanced tracking</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Coming Soon
                </Button>
              </div>
              <p className="text-xs text-gray-600">
                Connect with Google Analytics, Mixpanel, and other tools
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Form Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Form Limits & Scheduling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="max-submissions">Maximum Submissions (Optional)</Label>
              <Input
                id="max-submissions"
                type="number"
                min="1"
                placeholder="Unlimited"
                onChange={(e) => updateSettings({ maxSubmissions: parseInt(e.target.value) || undefined })}
              />
              <p className="text-xs text-gray-600 mt-1">
                Automatically close form after this many submissions
              </p>
            </div>

            <div>
              <Label htmlFor="close-date">Close Date (Optional)</Label>
              <Input
                id="close-date"
                type="datetime-local"
                onChange={(e) => updateSettings({ closeDate: e.target.value || undefined })}
              />
              <p className="text-xs text-gray-600 mt-1">
                Automatically close form at this date and time
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require-login" className="text-base font-medium">
                  Require Login to Submit
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Only authenticated users can submit this form
                </p>
              </div>
              <Switch
                id="require-login"
                checked={settings.requireLogin || false}
                onCheckedChange={(checked) => updateSettings({ requireLogin: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}