import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Server,
  Lock,
  FileArchive,
  RefreshCw,
  FolderTree,
  Terminal,
} from 'lucide-react';
import { toast } from 'sonner';

type DownloadState = 'normal' | 'preparing' | 'downloading' | 'success' | 'error';

export const MaintenancePage: React.FC = () => {
  const { user, profile, getAccessToken } = useAuth();
  const [downloadState, setDownloadState] = useState<DownloadState>('normal');
  const [probeResult, setProbeResult] = useState<{ status: number; text: string } | null>(null);
  const [probing, setProbing] = useState(false);

  const isAdmin =
    profile?.role === 'admin' ||
    (Array.isArray(profile?.permissions) && (profile.permissions as string[]).includes('source_code.download'));


  // Exact button label states required:
  // - Normal: “Download Source Code”
  // - Preparing: “Preparing ZIP…”
  // - Downloading: “Downloading…”
  // - Success: “Source code backup downloaded.”
  // - Error: “Unable to create source-code backup.”
  const getButtonContent = () => {
    switch (downloadState) {
      case 'preparing':
        return (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Preparing ZIP…
          </>
        );
      case 'downloading':
        return (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Downloading…
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2 text-primary-foreground" />
            Source code backup downloaded.
          </>
        );
      case 'error':
        return (
          <>
            <AlertTriangle className="h-4 w-4 mr-2 text-destructive-foreground" />
            Unable to create source-code backup.
          </>
        );
      case 'normal':
      default:
        return (
          <>
            <Download className="h-4 w-4 mr-2" />
            Download Source Code
          </>
        );
    }
  };

  const isButtonDisabled = downloadState === 'preparing' || downloadState === 'downloading';

  const handleDownloadSourceCode = async () => {
    if (isButtonDisabled) return;

    try {
      setDownloadState('preparing');

      // 1. Fetch current authentic Supabase session access token
      const token = await getAccessToken();

      if (!token) {
        setDownloadState('error');
        toast.error('Authentication session required. Please log in as an administrator.');
        setTimeout(() => setDownloadState('normal'), 4000);
        return;
      }

      // 2. Transition to Downloading state and initiate request to backend
      setDownloadState('downloading');

      const response = await fetch('/api/admin/source-code/download', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 3. Handle authorization and security errors
      if (!response.ok) {
        let errorMessage = 'Failed to generate source code backup.';
        try {
          const errorJson = await response.json();
          if (errorJson?.error) {
            errorMessage = errorJson.error;
          }
        } catch {
          // Fallback message
        }

        if (response.status === 401) {
          toast.error('Unauthorized: Your session has expired or is invalid.');
        } else if (response.status === 403) {
          toast.error('Forbidden: Administrator privileges required to download source code.');
        } else {
          toast.error(errorMessage);
        }

        setDownloadState('error');
        setTimeout(() => setDownloadState('normal'), 4000);
        return;
      }

      // 4. Extract safe filename from Content-Disposition header
      const disposition = response.headers.get('content-disposition');
      let filename = 'website-source-backup.zip';
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match?.[1]) {
          filename = match[1];
        }
      }

      // 5. Convert stream to blob and trigger real browser download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);

      // 6. Set Success state and show notification
      setDownloadState('success');
      toast.success('Source code backup downloaded successfully.');

      // Return to normal state after 4 seconds
      setTimeout(() => {
        setDownloadState('normal');
      }, 4000);
    } catch (err: any) {
      console.error('[Download Error]:', err);
      setDownloadState('error');
      toast.error('Unable to create source-code backup.');
      setTimeout(() => setDownloadState('normal'), 4000);
    }
  };

  // Test probe to verify server-side 401/403/200 HTTP responses
  const handleRunSecurityProbe = async () => {
    setProbing(true);
    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/admin/source-code/download', {
        method: 'GET',
        headers,
      });

      const contentType = res.headers.get('content-type') || '';
      let text = '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        text = JSON.stringify(json);
      } else {
        text = `Binary ZIP stream (${res.headers.get('content-length') || 'streamed'} bytes)`;
      }

      setProbeResult({
        status: res.status,
        text,
      });

      if (res.status === 200) {
        toast.success('Security Probe Passed: HTTP 200 (Administrator authorized)');
      } else if (res.status === 403) {
        toast.warning('Security Probe Enforced: HTTP 403 Forbidden (Non-admin rejected)');
      } else if (res.status === 401) {
        toast.info('Security Probe Enforced: HTTP 401 Unauthorized (Missing/invalid token)');
      }
    } catch (e: any) {
      setProbeResult({
        status: 500,
        text: e.message || 'Probe failed',
      });
    } finally {
      setProbing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center text-xs text-muted-foreground space-x-2">
        <span>Admin Panel</span>
        <span>/</span>
        <span>Settings</span>
        <span>/</span>
        <span className="text-foreground font-medium">Developer Tools & Maintenance</span>
      </nav>

      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">System Tools & Maintenance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage system backups, diagnostics, and developer utilities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={isAdmin ? 'default' : 'secondary'}
            className="flex items-center gap-1.5 py-1 px-3 text-xs"
          >
            {isAdmin ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
            {isAdmin ? 'Admin Clearance' : 'Restricted Access'}
          </Badge>
        </div>
      </div>

      {/* Session & Security Overview Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              Administrator Authorization & Security Status
            </CardTitle>
            <Badge variant="outline" className="text-[11px] font-mono">
              GET /api/admin/source-code/download
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Backend authorization is independently enforced via Supabase session tokens.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
              <span className="text-[11px] text-muted-foreground block">Active Account</span>
              <span className="text-xs font-semibold text-foreground truncate block mt-0.5">
                {user ? user.email : 'No user logged in'}
              </span>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
              <span className="text-[11px] text-muted-foreground block">Assigned Role</span>
              <span className="text-xs font-semibold text-foreground capitalize block mt-0.5">
                {String(profile?.role || (user ? 'Standard User' : 'Unauthenticated'))}
              </span>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
              <span className="text-[11px] text-muted-foreground block">Permission Grant</span>
              <span className="text-xs font-semibold text-foreground block mt-0.5">
                {isAdmin ? (
                  <span className="text-primary flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> source_code.download
                  </span>
                ) : (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5" /> Denied
                  </span>
                )}
              </span>
            </div>
          </div>

          {!isAdmin && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Administrator Clearance Required</p>
                <p className="mt-0.5 text-[11px] opacity-90">
                  You are currently logged in with a non-admin account. Normal users and guests cannot
                  download the source code. Switch to the Admin account using the header button to perform this action.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CORE FEATURE CARD: Download Full Source Code */}
      <Card className="border-border shadow-md bg-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <FileArchive className="h-5 w-5 text-primary" />
                Download Full Source Code
              </CardTitle>
              <CardDescription className="text-sm">
                Create a secure ZIP backup of the current website source code.
              </CardDescription>
            </div>
            <Badge variant="outline" className="self-start sm:self-auto text-xs py-1">
              Admin Exclusive
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Security & Exclusion Checklist */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-3">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <FolderTree className="h-3.5 w-3.5 text-primary" />
              Automated Archive Protections & Sanitation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Production `.env*` files stripped & sanitized</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Certificates & private keys (`*.pem`, `*.key`) omitted</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Heavy artifacts (`node_modules`, `dist`, `.git`) excluded</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Safe `.env.example` placeholder template included</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Fixed project root validation with traversal prevention</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Real zlib level-9 compressed streaming archive</span>
              </div>
            </div>
          </div>

          {/* Action Trigger Area */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
            <div className="text-xs text-muted-foreground">
              {downloadState === 'normal' && 'Generates: website-source-backup-YYYY-MM-DD-HHMM.zip'}
              {downloadState === 'preparing' && 'Scanning verified directory structure…'}
              {downloadState === 'downloading' && 'Streaming compressed archive to browser…'}
              {downloadState === 'success' && 'Archive successfully received and downloaded.'}
              {downloadState === 'error' && 'Failed to create archive. Check permissions or network.'}
            </div>

            <Button
              size="lg"
              onClick={handleDownloadSourceCode}
              disabled={isButtonDisabled || !isAdmin}
              variant={downloadState === 'error' ? 'destructive' : 'default'}
              className={`h-11 px-6 font-medium transition-all ${
                downloadState === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
              }`}
            >
              {getButtonContent()}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backend Security Probe & Inspector */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" />
              Live Security Probe (Server Endpoint Verification)
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunSecurityProbe}
              disabled={probing}
              className="text-xs h-7 gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${probing ? 'animate-spin' : ''}`} />
              Test API Endpoint
            </Button>
          </div>
          <CardDescription className="text-xs">
            Send an actual HTTP request to <code className="text-primary font-mono text-[11px]">/api/admin/source-code/download</code> with current credentials to test server-side authentication response.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {probeResult ? (
            <div className="p-3 bg-muted/60 rounded-lg font-mono text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">HTTP Status:</span>
                <Badge
                  variant={probeResult.status === 200 ? 'default' : probeResult.status === 403 ? 'destructive' : 'secondary'}
                  className="font-mono text-xs"
                >
                  {probeResult.status} {probeResult.status === 200 ? 'OK (Authorized)' : probeResult.status === 403 ? 'Forbidden (Access Denied)' : 'Unauthorized'}
                </Badge>
              </div>
              <div className="text-muted-foreground text-[11px] truncate pt-1">
                Server Response: <span className="text-foreground">{probeResult.text}</span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground italic text-center">
              Click &quot;Test API Endpoint&quot; to probe the backend download endpoint and inspect response code.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
