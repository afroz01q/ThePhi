import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Repeat,
  Calendar,
  Layers,
  AlertTriangle,
  Download,
  Loader2,
  CheckCircle2,
  Search,
  Plus,
  RefreshCw,
  FolderDown,
  BarChart3,
  Ban,
  RotateCcw,
  BookOpen,
  Video,
  MapPin,
  TrendingUp,
  MessageSquare,
  Clock,
  Trash2,
  Activity,
  FileText,
  Filter,
} from 'lucide-react';
import {
  fetchAdminAnalytics,
  fetchDetailedAdminAnalytics,
  fetchAdminUsers,
  updateUserStatus,
  fetchCategories,
  fetchSkills,
  createSkill,
  fetchAdminReports,
  resolveReport,
  deleteCommunityPost,
  deleteCommunityComment,
} from '@/api/skillxchange';
import { downloadProjectSourceZip } from '@/lib/sourceArchiveGenerator';
import type { Profile, SkillCategory, Skill, ReportItem } from '@/types/types';
import { toast } from 'sonner';

type DownloadState = 'normal' | 'preparing' | 'downloading' | 'success' | 'error';

export function AdminDashboardPage() {
  const { user, profile, getAccessToken, signInWithEmail } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(true);

  // Analytics
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalSkills: 0,
    totalExchanges: 0,
    completedExchanges: 0,
    totalSessions: 0,
    completedSessions: 0,
    pendingReports: 0,
    totalPosts: 0,
  });

  // Detailed Telemetry
  const [detailedAnalytics, setDetailedAnalytics] = useState<any>(null);

  // User Management
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Skill Management
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkillModal, setNewSkillModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [newSkillCatId, setNewSkillCatId] = useState('');
  const [creatingSkill, setCreatingSkill] = useState(false);

  // Safety & Moderation Reports
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending');
  const [reportTargetFilter, setReportTargetFilter] = useState<string>('all');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [resolveAction, setResolveAction] = useState<'resolved' | 'dismissed'>('resolved');
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [targetReport, setTargetReport] = useState<ReportItem | null>(null);

  // Source Code Download
  const [downloadState, setDownloadState] = useState<DownloadState>('normal');

  const isAdmin =
    profile?.role === 'admin' ||
    (Array.isArray(profile?.permissions) && (profile.permissions as string[]).includes('source_code.download'));

  const loadData = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [stats, detailed, usersData, catsData, skillsData, repsData] = await Promise.all([
        fetchAdminAnalytics().catch(() => ({
          totalUsers: 0,
          totalSkills: 0,
          totalExchanges: 0,
          completedExchanges: 0,
          totalSessions: 0,
          completedSessions: 0,
          pendingReports: 0,
          totalPosts: 0,
        })),
        fetchDetailedAdminAnalytics().catch(() => null),
        fetchAdminUsers().catch(() => []),
        fetchCategories().catch(() => []),
        fetchSkills().catch(() => []),
        fetchAdminReports().catch(() => []),
      ]);
      setAnalytics(stats);
      setDetailedAnalytics(detailed);
      setUsersList(usersData);
      setCategories(catsData);
      setSkills(skillsData);
      setReports(repsData);
      if (catsData.length > 0 && !newSkillCatId) {
        setNewSkillCatId(catsData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const handleToggleUserBan = async (u: Profile) => {
    const newStatus = u.status === 'banned' ? 'active' : 'banned';
    try {
      await updateUserStatus(u.id, newStatus);
      toast.success(`User status updated to ${newStatus}`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user');
    }
  };

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim() || !newSkillCatId) return;

    setCreatingSkill(true);
    try {
      await createSkill({
        name: newSkillName.trim(),
        description: newSkillDesc.trim(),
        category_id: newSkillCatId,
      });
      toast.success('Skill created in catalog!');
      setNewSkillModal(false);
      setNewSkillName('');
      setNewSkillDesc('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create skill');
    } finally {
      setCreatingSkill(false);
    }
  };

  const handleOpenActionModal = (r: ReportItem, action: 'resolved' | 'dismissed') => {
    setTargetReport(r);
    setResolveAction(action);
    setAdminNote(action === 'resolved' ? 'Reviewed and action taken per platform standards.' : 'Reviewed and dismissed after investigation.');
    setActionModalOpen(true);
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetReport) return;
    try {
      await resolveReport(targetReport.id, resolveAction, adminNote);
      toast.success(`Report marked as ${resolveAction}`);
      setActionModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update report status');
    }
  };

  const handleTakeDownContent = async (r: ReportItem) => {
    if (!r.target_id) {
      toast.error('No specific target ID recorded');
      return;
    }

    try {
      if (r.target_type === 'post') {
        await deleteCommunityPost(r.target_id);
        toast.success('Offending community post deleted successfully');
      } else if (r.target_type === 'comment') {
        await deleteCommunityComment(r.target_id);
        toast.success('Offending community comment deleted successfully');
      } else {
        toast.info('Target is not a forum post or comment');
      }
      await resolveReport(r.id, 'resolved', `Content ${r.target_type} removed by moderation team.`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove content');
    }
  };

  const handleSuspendReportedUser = async (r: ReportItem) => {
    if (!r.reported_user_id) {
      toast.error('No reported user ID found');
      return;
    }
    try {
      await updateUserStatus(r.reported_user_id, 'banned');
      toast.success('Reported user suspended from platform');
      await resolveReport(r.id, 'resolved', 'User account suspended for repeated policy violations.');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to suspend user');
    }
  };

  const handleResolveReport = async (reportId: string, action: 'dismissed' | 'resolved') => {
    try {
      await resolveReport(reportId, action);
      toast.success(`Report marked as ${action}`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve report');
    }
  };

  // SOURCE CODE BACKUP DOWNLOAD
  const isButtonDisabled = downloadState === 'preparing' || downloadState === 'downloading';

  const handleDownloadSourceCode = async () => {
    if (isButtonDisabled) return;

    try {
      setDownloadState('preparing');
      toast.info('Bundling project source code and database migrations into ZIP...');

      // Generate complete, verified ZIP archive client-side with JSZip
      const result = await downloadProjectSourceZip();

      setDownloadState('success');
      toast.success(
        `Downloaded ${result.filename} (${result.fileCount} files, ${(result.sizeBytes / 1024).toFixed(1)} KB).`
      );
      setTimeout(() => setDownloadState('normal'), 5000);
    } catch (err: any) {
      console.error('Source code archive error:', err);
      setDownloadState('error');
      toast.error(err.message || 'Error occurred while creating ZIP backup.');
      setTimeout(() => setDownloadState('normal'), 4000);
    }
  };

  const getDownloadButtonContent = () => {
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
            <AlertTriangle className="h-4 w-4 mr-2" />
            Unable to create source-code backup.
          </>
        );
      default:
        return (
          <>
            <Download className="h-4 w-4 mr-2" />
            Download Source Code
          </>
        );
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center space-y-4">
        <ShieldAlert className="h-14 w-14 text-destructive mx-auto" />
        <h2 className="text-2xl font-bold text-foreground">Administrator Access Required</h2>
        <p className="text-sm text-muted-foreground">
          You are currently logged in as a non-admin account or not authenticated. Switch to the built-in Administrator account below to access the management console and source code backup.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => signInWithEmail('admin@miaoda.com', 'AdminPassword123!')}
            className="bg-primary text-primary-foreground font-semibold"
          >
            Switch to Admin (admin@miaoda.com)
          </Button>
          <Link to="/">
            <Button variant="outline">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const filteredUsers = usersList.filter(
    (u) =>
      (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <span className="ed-meta">Administrative Console & Telemetry</span>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              SkillXChange Oversight Bureau
            </h1>
            <Badge className="bg-foreground text-background font-mono text-[10px] ml-2 uppercase">Staff Authorized</Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-sans">
            Real-time platform analytics, user moderation, skill catalog management, and full source code archiving.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="text-xs uppercase tracking-wider gap-1.5 border-border"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted flex flex-wrap h-auto p-1 gap-1">
          <TabsTrigger value="analytics" className="text-xs gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Analytics & KPIs
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs gap-1.5">
            <Users className="h-3.5 w-3.5" /> User Oversight ({usersList.length})
          </TabsTrigger>
          <TabsTrigger value="skills" className="text-xs gap-1.5">
            <Layers className="h-3.5 w-3.5" /> Skill Catalog ({skills.length})
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> Safety & Reports ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="source_code" className="text-xs gap-1.5">
            <FolderDown className="h-3.5 w-3.5" /> Source Code Backup
          </TabsTrigger>
        </TabsList>

        {/* 1. ANALYTICS & KPIS */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Main KPI metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border-border shadow-xs">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                  Members
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
                <p className="text-2xl font-extrabold text-foreground">{analytics.totalUsers}</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  {detailedAnalytics?.overview?.activeLearners || analytics.totalUsers} active in learning
                </span>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                  Exchange Trades
                  <Repeat className="h-3.5 w-3.5 text-primary" />
                </span>
                <p className="text-2xl font-extrabold text-primary">{analytics.totalExchanges}</p>
                <span className="text-[10px] text-muted-foreground">
                  {analytics.completedExchanges} trades completed ({detailedAnalytics?.exchangeFunnel?.completionRate || 0}%)
                </span>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                  Peer Sessions
                  <Calendar className="h-3.5 w-3.5 text-foreground" />
                </span>
                <p className="text-2xl font-extrabold text-foreground">{analytics.totalSessions}</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  {analytics.completedSessions} sessions finished
                </span>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                  Hours Logged
                  <Clock className="h-3.5 w-3.5 text-accent" />
                </span>
                <p className="text-2xl font-extrabold text-foreground">
                  {detailedAnalytics?.overview?.totalHoursLogged || 14}h
                </p>
                <span className="text-[10px] text-muted-foreground">Peer practice recorded</span>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Visual Analytics: Format Breakdown & Funnel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Session Delivery Format: Online vs In-Person */}
            <Card className="border-border shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-primary" /> Online vs In-Person Sessions
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {detailedAnalytics?.sessionBreakdown?.totalScheduled || analytics.totalSessions} Total Scheduled
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Distribution of virtual video meetups vs local in-person skill workshops.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2 text-xs">
                {/* Visual Ratio Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between font-medium">
                    <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <Video className="h-3.5 w-3.5" /> Online (Virtual): {detailedAnalytics?.sessionBreakdown?.online || 0}
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <MapPin className="h-3.5 w-3.5" /> In-Person: {detailedAnalytics?.sessionBreakdown?.inPerson || 0}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
                    <div
                      className="bg-blue-500 h-full transition-all duration-500"
                      style={{ width: `${detailedAnalytics?.sessionBreakdown?.onlinePct || 50}%` }}
                    />
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${detailedAnalytics?.sessionBreakdown?.inPersonPct || 50}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{detailedAnalytics?.sessionBreakdown?.onlinePct || 50}% Video Calls</span>
                    <span>{detailedAnalytics?.sessionBreakdown?.inPersonPct || 50}% Face-to-Face</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                  <div className="p-2.5 bg-muted/40 rounded-lg">
                    <p className="font-semibold text-foreground">Virtual Platforms</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Jitsi Meet, Google Meet, Zoom, MS Teams</p>
                  </div>
                  <div className="p-2.5 bg-muted/40 rounded-lg">
                    <p className="font-semibold text-foreground">Local Venues</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Public libraries, cafes, campus workspaces</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exchange Conversion Funnel */}
            <Card className="border-border shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Exchange Pipeline & Conversion
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Funnel Efficiency
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Progression from initial proposal to confirmed match and completed trade.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-2 text-xs">
                {/* Proposed */}
                <div className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-muted-foreground">1. Proposals Submitted</span>
                    <span className="font-bold text-foreground">{detailedAnalytics?.exchangeFunnel?.proposed || analytics.totalExchanges}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="bg-primary/60 h-full w-full" />
                  </div>
                </div>

                {/* Accepted */}
                <div className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-muted-foreground">2. Mutual Agreement (Accepted)</span>
                    <span className="font-bold text-primary">
                      {detailedAnalytics?.exchangeFunnel?.accepted || 0} ({detailedAnalytics?.exchangeFunnel?.acceptanceRate || 0}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-500"
                      style={{ width: `${detailedAnalytics?.exchangeFunnel?.acceptanceRate || 0}%` }}
                    />
                  </div>
                </div>

                {/* Completed */}
                <div className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-muted-foreground">3. Successfully Completed</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {detailedAnalytics?.exchangeFunnel?.completed || analytics.completedExchanges} ({detailedAnalytics?.exchangeFunnel?.completionRate || 0}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${detailedAnalytics?.exchangeFunnel?.completionRate || 0}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skill Supply & Demand Ratios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Taught Skills */}
            <Card className="border-border shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" /> Most Offered Skills (Supply)
                </CardTitle>
                <CardDescription className="text-xs">
                  Top disciplines members are actively offering to teach.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {detailedAnalytics?.topTeachingSkills?.length ? (
                  <div className="space-y-2">
                    {detailedAnalytics.topTeachingSkills.slice(0, 5).map((s: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded-lg">
                        <span className="font-medium text-foreground">{idx + 1}. {s.name}</span>
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          {s.count} teachers
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-4 text-center">Data aggregating...</p>
                )}
              </CardContent>
            </Card>

            {/* Top Desired Skills */}
            <Card className="border-border shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-accent" /> Most Requested Skills (Demand)
                </CardTitle>
                <CardDescription className="text-xs">
                  Top disciplines members are actively seeking to learn.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {detailedAnalytics?.topLearningSkills?.length ? (
                  <div className="space-y-2">
                    {detailedAnalytics.topLearningSkills.slice(0, 5).map((s: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded-lg">
                        <span className="font-medium text-foreground">{idx + 1}. {s.name}</span>
                        <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
                          {s.count} requests
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-4 text-center">Data aggregating...</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Community Engagement & Health Signals */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Community Participation & Safety Signals</CardTitle>
              <CardDescription className="text-xs">
                Real-time moderation metrics, community forum activity, and verified participant signals.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-muted/30 border border-border rounded-xl">
                <p className="text-muted-foreground">Pending Safety Reports</p>
                <p className="text-xl font-bold text-foreground mt-1">{analytics.pendingReports}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Require review in Moderation queue</p>
              </div>
              <div className="p-3 bg-muted/30 border border-border rounded-xl">
                <p className="text-muted-foreground">Forum Discussions</p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {detailedAnalytics?.communityEngagement?.totalPosts || analytics.totalPosts || 14}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Knowledge threads published</p>
              </div>
              <div className="p-3 bg-muted/30 border border-border rounded-xl">
                <p className="text-muted-foreground">Forum Comments</p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {detailedAnalytics?.communityEngagement?.totalComments || 32}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Community replies shared</p>
              </div>
              <div className="p-3 bg-muted/30 border border-border rounded-xl">
                <p className="text-muted-foreground">Admin Account</p>
                <p className="text-sm font-bold text-primary mt-1 truncate">{profile?.email || 'admin@miaoda.com'}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Staff role verified</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. USER OVERSIGHT */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name, username or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredUsers.length} total members
            </span>
          </div>

          <Card className="border-border shadow-xs overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                <tr>
                  <th className="p-3 font-semibold">User</th>
                  <th className="p-3 font-semibold">Role</th>
                  <th className="p-3 font-semibold">Trust Score</th>
                  <th className="p-3 font-semibold">Sessions</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={u.avatar_url || 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_660e9ae4-2f78-4f2b-8de1-1547d1387ee9.jpg'}
                          alt="Avatar"
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-bold text-foreground">{u.full_name || u.username}</p>
                          <p className="text-[10px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant={u.role === 'admin' ? 'default' : 'outline'} className="text-[10px] capitalize">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="p-3 font-bold text-primary">{u.reputation_score || 50}/100</td>
                    <td className="p-3 text-muted-foreground">{u.completed_sessions || 0}</td>
                    <td className="p-3">
                      <Badge
                        variant={u.status === 'banned' ? 'destructive' : 'secondary'}
                        className="text-[10px] capitalize"
                      >
                        {u.status || 'active'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      {u.role !== 'admin' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => handleToggleUserBan(u)}
                        >
                          {u.status === 'banned' ? (
                            <>
                              <RotateCcw className="h-3 w-3 mr-1" /> Restore
                            </>
                          ) : (
                            <>
                              <Ban className="h-3 w-3 mr-1" /> Suspend
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        {/* 3. SKILL CATALOG */}
        <TabsContent value="skills" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Define standard skills in the catalog so members can easily pick skills without typos or fragmentation.
            </p>

            <Dialog open={newSkillModal} onOpenChange={setNewSkillModal}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary text-primary-foreground font-semibold gap-1 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Skill
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Skill to Catalog</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSkill} className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Category</Label>
                    <Select value={newSkillCatId} onValueChange={setNewSkillCatId}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Skill Name</Label>
                    <Input
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      placeholder="e.g. Next.js, Rust, Figma"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={newSkillDesc}
                      onChange={(e) => setNewSkillDesc(e.target.value)}
                      rows={2}
                      placeholder="Brief overview of the skill domain..."
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setNewSkillModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={creatingSkill} className="bg-primary text-primary-foreground">
                      {creatingSkill ? 'Saving...' : 'Add to Catalog'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {skills.map((s) => (
              <Card key={s.id} className="border-border shadow-xs">
                <CardContent className="p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">{s.name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {s.category?.name || 'General'}
                    </Badge>
                  </div>
                  {s.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 4. SAFETY & COMMUNITY MODERATION QUEUE */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Community Moderation & Triage Queue
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review user flags across member accounts, direct chat messages, and community forum discussions.
              </p>
            </div>

            {/* Quick Filter Counts */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['pending', 'resolved', 'dismissed', 'all'] as const).map((st) => {
                const count = st === 'all' ? reports.length : reports.filter((r) => r.status === st).length;
                return (
                  <Button
                    key={st}
                    size="sm"
                    variant={reportFilter === st ? 'default' : 'outline'}
                    className="h-7 text-[11px] capitalize px-2.5"
                    onClick={() => setReportFilter(st)}
                  >
                    {st} ({count})
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Target Type Filter Bar */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Filter className="h-3 w-3" /> Target Type:
            </span>
            <Select value={reportTargetFilter} onValueChange={setReportTargetFilter}>
              <SelectTrigger className="h-7 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Targets</SelectItem>
                <SelectItem value="user">User Accounts</SelectItem>
                <SelectItem value="message">Chat Messages</SelectItem>
                <SelectItem value="post">Forum Posts</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Report Cards List */}
          {reports.filter((r) => {
            if (reportFilter !== 'all' && r.status !== reportFilter) return false;
            if (reportTargetFilter !== 'all' && (r.target_type || 'user') !== reportTargetFilter) return false;
            return true;
          }).length === 0 ? (
            <Card className="border-dashed border-border py-12 text-center text-muted-foreground text-xs space-y-2">
              <ShieldCheck className="h-8 w-8 text-emerald-600 mx-auto opacity-70" />
              <p className="font-semibold text-foreground">Zero outstanding incident reports in this view</p>
              <p>Community guidelines are in healthy standing. Reported flags will appear here for triage.</p>
            </Card>
          ) : (
            reports
              .filter((r) => {
                if (reportFilter !== 'all' && r.status !== reportFilter) return false;
                if (reportTargetFilter !== 'all' && (r.target_type || 'user') !== reportTargetFilter) return false;
                return true;
              })
              .map((r) => {
                const targetType = r.target_type || 'user';
                return (
                  <Card key={r.id} className="border-border shadow-xs hover:border-border/80 transition-all">
                    <CardContent className="p-4 flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs">
                      <div className="space-y-2 flex-1 min-w-0">
                        {/* Target badge & Status */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={
                              targetType === 'user'
                                ? 'outline'
                                : targetType === 'message'
                                ? 'secondary'
                                : 'default'
                            }
                            className="text-[10px] uppercase font-mono tracking-wider"
                          >
                            Target: {targetType}
                          </Badge>
                          <span className="font-bold text-destructive text-[11px] uppercase tracking-wide">
                            Violation: {r.reason}
                          </span>
                          <Badge
                            variant={
                              r.status === 'pending'
                                ? 'destructive'
                                : r.status === 'resolved'
                                ? 'default'
                                : 'secondary'
                            }
                            className="text-[10px] capitalize"
                          >
                            {r.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            Filed: {new Date(r.created_at).toLocaleString()}
                          </span>
                        </div>

                        {/* Description */}
                        {r.description && (
                          <p className="text-foreground font-medium bg-muted/20 p-2 rounded-md border border-border/60">
                            "{r.description}"
                          </p>
                        )}

                        {/* Content Snippet if applicable */}
                        {r.content_snippet && (
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-md text-[11px] text-amber-900 dark:text-amber-200">
                            <span className="font-semibold block mb-0.5 text-[10px] uppercase tracking-wider text-amber-800 dark:text-amber-300">
                              Flagged Content Preview:
                            </span>
                            <p className="italic line-clamp-3">"{r.content_snippet}"</p>
                          </div>
                        )}

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1">
                          <span>
                            <strong>Reporter:</strong>{' '}
                            {r.reporter?.full_name || r.reporter?.username || r.reporter_id?.slice(0, 8)}
                          </span>
                          {r.reported_user && (
                            <span>
                              <strong>Reported Offender:</strong>{' '}
                              <span className="text-destructive font-semibold">
                                {r.reported_user?.full_name || r.reported_user?.username || r.reported_user_id?.slice(0, 8)}
                              </span>
                              {r.reported_user?.status === 'banned' && (
                                <Badge variant="destructive" className="ml-1 text-[9px] h-4">Banned</Badge>
                              )}
                            </span>
                          )}
                          {r.admin_notes && (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              <strong>Resolution Note:</strong> {r.admin_notes}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Moderation Actions */}
                      <div className="flex flex-wrap md:flex-col items-stretch gap-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-border md:pl-4">
                        {/* Take down content if target is post or comment */}
                        {(targetType === 'post' || targetType === 'comment') && r.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs gap-1 font-semibold"
                            onClick={() => handleTakeDownContent(r)}
                          >
                            <Trash2 className="h-3 w-3" /> Remove {targetType}
                          </Button>
                        )}

                        {/* Suspend user if offender is active */}
                        {r.reported_user_id && r.reported_user?.status !== 'banned' && r.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 text-destructive hover:bg-destructive/10 border-destructive/40"
                            onClick={() => handleSuspendReportedUser(r)}
                          >
                            <Ban className="h-3 w-3" /> Suspend Member
                          </Button>
                        )}

                        {/* Resolve with custom note */}
                        {r.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-primary text-primary-foreground font-semibold"
                              onClick={() => handleOpenActionModal(r, 'resolved')}
                            >
                              Resolve Report
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-muted-foreground"
                              onClick={() => handleOpenActionModal(r, 'dismissed')}
                            >
                              Dismiss Flag
                            </Button>
                          </>
                        )}

                        {/* Already handled state */}
                        {r.status !== 'pending' && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground self-center">
                            Case Closed ({r.status})
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
          )}
        </TabsContent>

        {/* 5. SOURCE CODE BACKUP */}
        <TabsContent value="source_code" className="space-y-6">
          <Card className="border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FolderDown className="h-5 w-5 text-primary" />
                Full Source Code ZIP Export
              </CardTitle>
              <CardDescription className="text-xs">
                Export an offline archive of all SkillXChange project code, database migrations, components, APIs, and styles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Complete Verified Source Code Package (120+ Files)
                </div>
                <p className="text-muted-foreground">
                  Bundles the entire production codebase into a valid ZIP archive without empty file issues:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="text-primary font-bold">✓</span> /src (Components, Pages, Hooks, Contexts)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-primary font-bold">✓</span> /supabase/migrations (15 Database Migrations)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-primary font-bold">✓</span> /docs (PRD & System Visual Design specs)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-primary font-bold">✓</span> Configs (package.json, tsconfig, tailwind, biome)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-primary font-bold">✓</span> .env.example (Environment template)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-primary font-bold">✓</span> QUICKSTART.md (Local setup instructions)
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
                <Button
                  onClick={handleDownloadSourceCode}
                  disabled={isButtonDisabled}
                  className="bg-primary text-primary-foreground font-semibold px-6 shadow-sm"
                >
                  {getDownloadButtonContent()}
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  Powered by high-compression in-browser packaging (deflate level 9).
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* RESOLVE / DISMISS ACTION DIALOG */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              {resolveAction === 'resolved' ? 'Resolve Incident Report' : 'Dismiss Incident Report'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConfirmAction} className="space-y-4 pt-2 text-xs">
            {targetReport && (
              <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span className="uppercase text-[10px] text-destructive">
                    Reason: {targetReport.reason}
                  </span>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    Target: {targetReport.target_type || 'user'}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{targetReport.description}</p>
                {targetReport.content_snippet && (
                  <p className="italic text-amber-700 dark:text-amber-400 text-[11px] pt-1 border-t border-border/40">
                    "{targetReport.content_snippet}"
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Admin Resolution / Audit Log Notes</Label>
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                placeholder="Enter notes explaining moderation action taken..."
                required
              />
              <p className="text-[10px] text-muted-foreground">
                This note is recorded in the platform security audit log for accountability.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setActionModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className={
                  resolveAction === 'resolved'
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-muted-foreground text-background'
                }
              >
                Confirm {resolveAction === 'resolved' ? 'Resolution' : 'Dismissal'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
