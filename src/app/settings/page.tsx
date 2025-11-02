"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  Shield, 
  Bell, 
  Loader2, 
  CheckCircle,
  ExternalLink,
  Unlink,
  FileText,
  ArrowLeft,
  LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    checkGoogleConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  // Handle OAuth callback
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (success === 'google_connected') {
      toast.success(decodeURIComponent(message || 'Google account connected successfully'));
      setTimeout(() => {
        checkGoogleConnection();
      }, 1000);
      // Clean up URL
      window.history.replaceState({}, '', '/settings');
    } else if (error?.startsWith('google_')) {
      toast.error(decodeURIComponent(message || 'Failed to connect Google account'));
      window.history.replaceState({}, '', '/settings');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const checkGoogleConnection = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/user/google-status?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setGoogleConnected(data.connected);
        setGoogleEmail(data.email);
      }
    } catch (error) {
      console.error('Error checking Google connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    if (!user) return;
    
    setConnecting(true);
    try {
      const response = await fetch(`/api/auth/google?userId=${user.id}&source=settings`);
      const data = await response.json();
      
      if (response.ok && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast.error(data.error || 'Failed to initiate Google authentication');
        setConnecting(false);
      }
    } catch (error) {
      console.error('Error connecting to Google:', error);
      toast.error('Failed to connect to Google');
      setConnecting(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to disconnect your Google account? This will affect all forms connected to Google Sheets.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/user/disconnect-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      
      if (response.ok) {
        toast.success('Google account disconnected successfully');
        setGoogleConnected(false);
        setGoogleEmail(null);
      } else {
        toast.error('Failed to disconnect Google account');
      }
    } catch (error) {
      console.error('Error disconnecting Google:', error);
      toast.error('Failed to disconnect Google account');
    }
  };

  if (!user) {
    return null;
  }

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
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
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
      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account and integrations</p>
        </div>

        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="user-id">User ID</Label>
                <Input
                  id="user-id"
                  value={user.id}
                  disabled
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Google Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ExternalLink className="w-5 h-5" />
                <span>Integrations</span>
              </CardTitle>
              <CardDescription>Connect external services to enhance your forms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 font-bold text-lg">G</span>
                    </div>
                    <div>
                      <h4 className="font-medium flex items-center space-x-2">
                        <span>Google Sheets</span>
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {!loading && googleConnected && <CheckCircle className="w-4 h-4 text-green-500" />}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {googleConnected 
                          ? `Connected as ${googleEmail || 'Google User'}` 
                          : 'Connect your Google account to sync form responses'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {!loading && (
                    googleConnected ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleDisconnectGoogle}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Unlink className="w-4 h-4 mr-2" />
                        Disconnect
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleConnectGoogle} 
                        disabled={connecting}
                        size="sm"
                      >
                        {connecting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <span className="font-bold mr-2">G</span>
                            Connect Google
                          </>
                        )}
                      </Button>
                    )
                  )}
                </div>

                {googleConnected && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Your Google account is connected. You can now sync form responses to Google Sheets from any form.
                    </AlertDescription>
                  </Alert>
                )}

                {!googleConnected && !loading && (
                  <div className="text-xs text-gray-600 space-y-1 mt-3">
                    <p>• Automatically sync form responses to Google Sheets</p>
                    <p>• Create new spreadsheets or connect to existing ones</p>
                    <p>• Secure OAuth 2.0 authentication</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-gray-600">Receive email updates about your forms</p>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Security</span>
              </CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-600">Add an extra layer of security</p>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
