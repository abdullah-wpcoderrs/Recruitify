"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ExternalLink, 
  RefreshCw, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Link as LinkIcon,
  Unlink,
  FileSpreadsheet,
  Loader2,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getForm } from "@/lib/database";
import { toast } from "sonner";

interface GoogleSheetsIntegrationProps {
  formId: string;
  isConnected?: boolean;
  sheetUrl?: string;
  sheetName?: string;
  lastSync?: string;
  totalRows?: number;
}

export function GoogleSheetsIntegration({ formId }: GoogleSheetsIntegrationProps) {
  interface FormWithSheets {
    title: string;
    google_sheet_id?: string;
    google_sheet_url?: string;
    fields?: Array<{ label: string }>;
  }

  interface SheetInfo {
    title?: string;
    url?: string;
    rowCount?: number;
    lastUpdated?: string;
  }

  interface UserSpreadsheet {
    id: string;
    name: string;
    url: string;
    modifiedTime: string;
    createdTime: string;
  }

  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showConnectExisting, setShowConnectExisting] = useState(false);
  const [showSpreadsheetList, setShowSpreadsheetList] = useState(false);
  const [existingSheetUrl, setExistingSheetUrl] = useState('');
  const [userSpreadsheets, setUserSpreadsheets] = useState<UserSpreadsheet[]>([]);
  const [loadingSpreadsheets, setLoadingSpreadsheets] = useState(false);
  const [hasGoogleAccess, setHasGoogleAccess] = useState(false);
  const [form, setForm] = useState<FormWithSheets | null>(null);
  const [sheetInfo, setSheetInfo] = useState<SheetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: _user } = useAuth();

  useEffect(() => {
    loadFormData();
    checkGoogleAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, _user]);



  const loadFormData = async () => {
    try {
      const { data, error } = await getForm(formId);
      if (error) throw error;
      
      setForm(data);
      
      // If form has a connected sheet, get its info
      const formData = data as unknown as FormWithSheets;
      if (formData?.google_sheet_id) {
        await loadSheetInfo(formData.google_sheet_id);
      }
    } catch (err) {
      setError('Failed to load form data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSheetInfo = async (sheetId: string) => {
    try {
      const response = await fetch(`/api/sheets/info/${sheetId}`);
      if (response.ok) {
        const { info } = await response.json();
        setSheetInfo(info);
      }
    } catch (err) {
      console.error('Error loading sheet info:', err);
    }
  };

  const checkGoogleAccess = async () => {
    if (!_user) return;
    
    try {
      const response = await fetch(`/api/sheets/status?formId=${formId}&userId=${_user.id}`);
      if (response.ok) {
        const { hasGoogleAccess: hasAccess } = await response.json();
        setHasGoogleAccess(hasAccess);
        
        // If user has access, load their spreadsheets
        if (hasAccess) {
          await loadUserSpreadsheets();
        }
      }
    } catch (err) {
      console.error('Error checking Google access:', err);
    }
  };

  const loadUserSpreadsheets = async () => {
    if (!_user) return;
    
    setLoadingSpreadsheets(true);
    try {
      const response = await fetch(`/api/sheets/list?userId=${_user.id}`);
      if (response.ok) {
        const { spreadsheets } = await response.json();
        setUserSpreadsheets(spreadsheets);
      }
    } catch (err) {
      console.error('Error loading spreadsheets:', err);
    } finally {
      setLoadingSpreadsheets(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId }),
      });
      
      if (!response.ok) {
        throw new Error('Sync failed');
      }
      
      const result = await response.json();
      toast.success(`Synced ${result.syncedCount} submissions to Google Sheets`);
      
      // Reload sheet info
      if (form?.google_sheet_id) {
        await loadSheetInfo(form.google_sheet_id);
      }
    } catch (err) {
      setError('Failed to sync data');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };



  const handleCreateSheet = async () => {
    if (!form || !_user) return;
    
    setConnecting(true);
    setError(null);
    
    try {
      const headers = form.fields?.map((field) => field.label) || [];
      
      const response = await fetch('/api/sheets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          userId: _user.id,
          title: `${form.title} - Responses`,
          headers,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create spreadsheet');
      
      await response.json();
      toast.success('Google Spreadsheet created and connected successfully!');
      
      // Reload form data
      await loadFormData();
    } catch (err) {
      setError('Failed to create spreadsheet');
      console.error(err);
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectExisting = async () => {
    if (!existingSheetUrl.trim()) {
      setError('Please enter a valid Google Sheets URL');
      return;
    }

    if (!form || !_user) {
      setError('Form data not available');
      return;
    }

    setConnecting(true);
    setError(null);
    
    try {
      const headers = form.fields?.map((field) => field.label) || [];
      
      const response = await fetch('/api/sheets/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          userId: _user.id,
          spreadsheetUrl: existingSheetUrl,
          headers,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to connect to spreadsheet');
      }
      
      toast.success('Successfully connected to existing Google Spreadsheet!');
      
      // Reload form data
      await loadFormData();
      setShowConnectExisting(false);
      setExistingSheetUrl('');
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to connect to spreadsheet');
      console.error(err);
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectFromList = async (spreadsheet: UserSpreadsheet) => {
    if (!form || !_user) {
      setError('Form data not available');
      return;
    }

    setConnecting(true);
    setError(null);
    
    try {
      const headers = form.fields?.map((field) => field.label) || [];
      
      // Use the new API endpoint that creates a new sheet in the existing spreadsheet
      const response = await fetch('/api/sheets/connect-with-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          userId: _user.id,
          spreadsheetId: spreadsheet.id,
          sheetName: `${form.title} - Responses`,
          headers,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to connect to spreadsheet');
      }
      
      toast.success(`Successfully connected to "${spreadsheet.name}"!`);
      
      // Reload form data
      await loadFormData();
      setShowSpreadsheetList(false);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to connect to spreadsheet');
      console.error(err);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect this Google Sheet? This will not delete the spreadsheet, but form submissions will no longer sync automatically.')) {
      return;
    }

    setConnecting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/sheets/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect spreadsheet');
      }
      
      toast.success('Google Spreadsheet disconnected successfully');
      
      // Reload form data
      await loadFormData();
    } catch (err) {
      setError('Failed to disconnect spreadsheet');
      console.error(err);
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          <span className="ml-2">Loading...</span>
        </CardContent>
      </Card>
    );
  }

  const isConnected = form?.google_sheet_id && form?.google_sheet_url;

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5" />
            <span>Google Sheets Integration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="font-medium text-gray-900 mb-2">Connect Google Sheets</h3>
          <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
            Automatically sync form responses to a Google Sheets spreadsheet for easy data management and analysis.
          </p>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-3">
            {!hasGoogleAccess ? (
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900 font-medium mb-1">Google Account Not Connected</p>
                  <p className="text-sm text-blue-700">
                    Connect your Google account in Settings to use Google Sheets integration.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => window.open('/settings', '_blank')} 
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Go to Settings
                  </Button>
                  <Button 
                    onClick={() => checkGoogleAccess()} 
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Button 
                  onClick={() => setShowSpreadsheetList(true)} 
                  disabled={connecting}
                  className="w-full"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Select from My Spreadsheets
                    </>
                  )}
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={handleCreateSheet} 
                    disabled={connecting}
                    variant="outline"
                  >
                    {connecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Create New
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={() => setShowConnectExisting(true)} 
                    disabled={connecting}
                    variant="outline"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Connect URL
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Connect Existing Sheet Modal */}
          {showConnectExisting && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-medium mb-3">Connect to Existing Sheet</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="sheet-url">Google Sheets URL or ID</Label>
                  <Input
                    id="sheet-url"
                    value={existingSheetUrl}
                    onChange={(e) => setExistingSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Paste the full URL or just the spreadsheet ID
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={handleConnectExisting} 
                    disabled={connecting || !existingSheetUrl.trim()}
                    size="sm"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect Sheet'
                    )}
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowConnectExisting(false);
                      setExistingSheetUrl('');
                      setError(null);
                    }} 
                    variant="outline" 
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Spreadsheet List Modal */}
          {showSpreadsheetList && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Choose from Your Spreadsheets</h4>
                <Button 
                  onClick={() => setShowSpreadsheetList(false)} 
                  variant="ghost" 
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {loadingSpreadsheets ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading spreadsheets...
                </div>
              ) : userSpreadsheets.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {userSpreadsheets.map((spreadsheet) => (
                    <div 
                      key={spreadsheet.id} 
                      className="flex items-center justify-between p-3 bg-white rounded border hover:bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{spreadsheet.name}</p>
                        <p className="text-xs text-gray-500">
                          Modified: {new Date(spreadsheet.modifiedTime).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-3">
                        <Button
                          onClick={() => window.open(spreadsheet.url, '_blank')}
                          variant="ghost"
                          size="sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleConnectFromList(spreadsheet)}
                          disabled={connecting}
                          size="sm"
                        >
                          {connecting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Connect'
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileSpreadsheet className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No spreadsheets found</p>
                  <p className="text-xs text-gray-500">Create a new one or connect an existing sheet by URL</p>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-gray-500">
            <p>• Real-time data synchronization</p>
            <p>• Automatic column mapping</p>
            <p>• Secure OAuth connection</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5" />
            <span>Google Sheets</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sheet Info */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-900">
                {sheetInfo?.title || form?.title || 'Connected Sheet'}
              </h4>
              <p className="text-sm text-gray-600">
                {sheetInfo?.rowCount || 0} rows • Last synced {sheetInfo?.lastUpdated ? 
                  new Date(sheetInfo.lastUpdated).toLocaleString() : 'Never'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(form?.google_sheet_url, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Sheet
              </Button>
            </div>
          </div>
          
          {/* Sync Status */}
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-600">All responses synced successfully</span>
          </div>
        </div>

        {/* Sheet Preview */}
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
            <h5 className="font-medium text-sm">Sheet Preview</h5>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Timestamp</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Full Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Email</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Experience</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Location</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { timestamp: "1/23/2024 14:32", name: "John Doe", email: "john@example.com", experience: "Mid-level", location: "Remote" },
                  { timestamp: "1/23/2024 13:45", name: "Jane Smith", email: "jane@example.com", experience: "Senior", location: "Hybrid" },
                  { timestamp: "1/23/2024 12:18", name: "Mike Johnson", email: "mike@example.com", experience: "Junior", location: "Remote" },
                ].map((row, index) => (
                  <tr key={index} className="border-t border-gray-100">
                    <td className="px-4 py-2 text-gray-600">{row.timestamp}</td>
                    <td className="px-4 py-2 text-gray-900">{row.name}</td>
                    <td className="px-4 py-2 text-gray-600">{row.email}</td>
                    <td className="px-4 py-2 text-gray-600">{row.experience}</td>
                    <td className="px-4 py-2 text-gray-600">{row.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-4 py-2 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(form?.google_sheet_url || sheetInfo?.url, '_blank')}
            >
              View all {sheetInfo?.rowCount || 0} rows in Google Sheets
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="border border-gray-100 rounded-lg p-4 space-y-4">
            <h5 className="font-medium">Integration Settings</h5>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Sheet URL</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    value={form?.google_sheet_url || ''}
                    readOnly
                    className="text-sm"
                  />
                  <Button variant="outline" size="sm">
                    Change
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Auto-sync</label>
                  <p className="text-xs text-gray-600">Automatically sync new responses</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Enabled
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Include timestamps</label>
                  <p className="text-xs text-gray-600">Add submission timestamp to sheet</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Enabled
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="text-red-600 hover:text-red-700"
              >
                <Unlink className="w-4 h-4 mr-2" />
                Disconnect Sheet
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}