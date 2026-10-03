import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Sparkles,
  Repeat,
  Calendar,
  MessageSquare,
  Award,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  BookOpen,
  Star,
  Trash2,
  Video,
  Shield,
  Layers,
  Camera,
  Users,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import {
  fetchMemberDetails,
  fetchExchangeRequests,
  fetchUserSessions,
  fetchSkills,
  addUserTeachingSkill,
  removeUserTeachingSkill,
  addUserLearningSkill,
  removeUserLearningSkill,
  computeSmartMatches,
  updateExchangeStatus,
  fetchUserConnections,
  getOrCreateCustomSkill,
} from '@/api/skillxchange';
import { AvatarUploadDialog } from '@/components/profile/AvatarUploadDialog';
import type {
  UserTeachingSkill,
  UserLearningSkill,
  ExchangeRequest,
  Session,
  Skill,
  MatchResult,
  Connection,
} from '@/types/types';
import { toast } from 'sonner';

export function UserDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [teachingSkills, setTeachingSkills] = useState<UserTeachingSkill[]>([]);
  const [learningSkills, setLearningSkills] = useState<UserLearningSkill[]>([]);
  const [requests, setRequests] = useState<ExchangeRequest[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);

  // Modals
  const [teachModalOpen, setTeachModalOpen] = useState(false);
  const [learnModalOpen, setLearnModalOpen] = useState(false);

  // Teach skill form
  const [teachSkillId, setTeachSkillId] = useState('');
  const [customTeachName, setCustomTeachName] = useState('');
  const [teachLevel, setTeachLevel] = useState('Intermediate');
  const [teachExp, setTeachExp] = useState('2');
  const [teachDesc, setTeachDesc] = useState('');
  const [teachFormat, setTeachFormat] = useState('Online');

  // Learn skill form
  const [learnSkillId, setLearnSkillId] = useState('');
  const [customLearnName, setCustomLearnName] = useState('');
  const [learnCurrent, setLearnCurrent] = useState('Beginner');
  const [learnTarget, setLearnTarget] = useState('Advanced');
  const [learnPriority, setLearnPriority] = useState('High');
  const [learnNotes, setLearnNotes] = useState('');

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [details, reqs, sess, matchRes, allSkills, userConns] = await Promise.all([
        fetchMemberDetails(user.id),
        fetchExchangeRequests(user.id),
        fetchUserSessions(user.id),
        computeSmartMatches(user.id),
        fetchSkills(),
        fetchUserConnections(user.id),
      ]);

      if (details) {
        setTeachingSkills(details.teachingSkills);
        setLearningSkills(details.learningSkills);
      }
      setRequests(reqs);
      setSessions(sess);
      setMatches(matchRes.slice(0, 3));
      setAvailableSkills(allSkills);
      setConnections(userConns);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleAddTeaching = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teachSkillId) {
      toast.error('Please select a skill or choose Other');
      return;
    }
    try {
      let finalSkillId = teachSkillId;
      if (teachSkillId === '__other__') {
        const trimmed = customTeachName.trim();
        if (!trimmed) {
          toast.error('Please enter the custom skill name');
          return;
        }
        const created = await getOrCreateCustomSkill(trimmed);
        finalSkillId = created.id;
      }

      await addUserTeachingSkill({
        skill_id: finalSkillId,
        proficiency_level: teachLevel,
        experience_years: parseFloat(teachExp) || 1,
        description: teachDesc,
        format: teachFormat,
      });
      toast.success('Teaching skill added successfully!');
      setTeachModalOpen(false);
      setTeachSkillId('');
      setCustomTeachName('');
      setTeachDesc('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add skill');
    }
  };

  const handleRemoveTeaching = async (id: string) => {
    if (teachingSkills.length <= 1) {
      toast.error('You must keep at least one teaching skill and one learning interest.');
      return;
    }
    try {
      await removeUserTeachingSkill(id);
      toast.success('Teaching skill removed');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'You must keep at least one teaching skill and one learning interest.');
    }
  };

  const handleAddLearning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnSkillId) {
      toast.error('Please select a skill or choose Other');
      return;
    }
    try {
      let finalSkillId = learnSkillId;
      if (learnSkillId === '__other__') {
        const trimmed = customLearnName.trim();
        if (!trimmed) {
          toast.error('Please enter the custom learning goal');
          return;
        }
        const created = await getOrCreateCustomSkill(trimmed);
        finalSkillId = created.id;
      }

      await addUserLearningSkill({
        skill_id: finalSkillId,
        current_level: learnCurrent,
        target_level: learnTarget,
        priority: learnPriority,
        notes: learnNotes,
        preferred_format: 'Online',
      });
      toast.success('Learning goal added successfully!');
      setLearnModalOpen(false);
      setLearnSkillId('');
      setCustomLearnName('');
      setLearnNotes('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add learning goal');
    }
  };

  const handleRemoveLearning = async (id: string) => {
    if (learningSkills.length <= 1) {
      toast.error('You must keep at least one teaching skill and one learning interest.');
      return;
    }
    try {
      await removeUserLearningSkill(id);
      toast.success('Learning goal removed');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'You must keep at least one teaching skill and one learning interest.');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await updateExchangeStatus(requestId, 'accepted');
      toast.success('Exchange proposal accepted! Conversation opened.');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept proposal');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await updateExchangeStatus(requestId, 'rejected');
      toast.success('Exchange request rejected');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update request');
    }
  };

  // Profile completion score
  const completionPercentage = Math.min(
    100,
    (teachingSkills.length > 0 ? 30 : 0) +
    (learningSkills.length > 0 ? 30 : 0) +
    (profile?.bio ? 20 : 0) +
    (profile?.location ? 20 : 0)
  );

  const pendingIncoming = requests.filter(r => r.receiver_id === user?.id && r.status === 'pending');
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled');

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Top Welcome & KPI Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border/80">
        <div className="flex items-start gap-4">
          <div className="relative group shrink-0">
            <img
              src={profile?.avatar_url || 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_660e9ae4-2f78-4f2b-8de1-1547d1387ee9.jpg'}
              alt={profile?.full_name || 'Member'}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-border shadow-xs bg-card"
            />
            <button
              type="button"
              onClick={() => setAvatarDialogOpen(true)}
              className="absolute inset-0 bg-black/60 text-white rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold cursor-pointer"
              title="Change Profile Picture"
            >
              <Camera className="h-5 w-5 mb-0.5" />
              <span>Change</span>
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="ed-meta">Desk of Practitioner</span>
              {profile?.role === 'admin' && (
                <Badge variant="outline" className="text-[10px] font-mono border-accent text-accent uppercase">Staff Admin</Badge>
              )}
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {profile?.full_name || profile?.username || 'Member'}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans">
              Manage your teaching portfolio, learning goals, active exchanges, and upcoming peer sessions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="text-xs font-semibold uppercase tracking-wider h-9 border-border gap-1.5"
            onClick={() => setAvatarDialogOpen(true)}
          >
            <Camera className="h-3.5 w-3.5 text-primary" />
            Change Photo
          </Button>
          <Link to="/connections">
            <Button size="sm" variant="outline" className="text-xs font-semibold uppercase tracking-wider h-9 border-border gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" />
              Connections
            </Button>
          </Link>
          <Link to="/matches">
            <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 gap-1.5 shadow-sm text-xs font-semibold uppercase tracking-wider h-9">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Matches
            </Button>
          </Link>
          <Link to={`/profile/${user?.id}`}>
            <Button size="sm" variant="outline" className="text-xs font-semibold uppercase tracking-wider h-9 border-border">
              Public Dossier
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="ed-card p-4 bg-card border border-border/80 space-y-1">
          <span className="ed-meta flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-accent" /> Reputation
          </span>
          <p className="font-serif text-2xl font-bold text-foreground">{profile?.reputation_score ?? 50}/100</p>
          <p className="text-[11px] text-muted-foreground">Community trust index</p>
        </div>

        <Link to="/connections" className="block">
          <div className="ed-card p-4 bg-card border border-border/80 space-y-1 hover:border-primary/40 transition-colors">
            <span className="ed-meta flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" /> Peers
            </span>
            <p className="font-serif text-2xl font-bold text-primary">
              {connections.filter(c => c.status === 'connected').length}
            </p>
            <p className="text-[11px] text-muted-foreground">Active peer connections</p>
          </div>
        </Link>

        <Link to="/exchanges" className="block">
          <div className="ed-card p-4 bg-card border border-border/80 space-y-1 hover:border-primary/40 transition-colors">
            <span className="ed-meta flex items-center gap-1.5">
              <Repeat className="h-3.5 w-3.5 text-accent" /> Trades
            </span>
            <p className="font-serif text-2xl font-bold text-foreground">
              {requests.filter(r => r.status === 'accepted').length}
            </p>
            <p className="text-[11px] text-muted-foreground">Reciprocal exchanges</p>
          </div>
        </Link>

        <Link to="/sessions" className="block">
          <div className="ed-card p-4 bg-card border border-border/80 space-y-1 hover:border-primary/40 transition-colors">
            <span className="ed-meta flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-accent" /> Sessions
            </span>
            <p className="font-serif text-2xl font-bold text-foreground">{upcomingSessions.length}</p>
            <p className="text-[11px] text-muted-foreground">Booked on calendar</p>
          </div>
        </Link>

        <div className="ed-card p-4 bg-card border border-border/80 space-y-1 col-span-2 md:col-span-1">
          <span className="ed-meta flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-accent" /> Reviews
          </span>
          <p className="font-serif text-2xl font-bold text-foreground">
            {profile?.average_rating ? `${profile.average_rating.toFixed(1)}/5.0` : '5.0/5.0'}
          </p>
          <p className="text-[11px] text-muted-foreground">From verified trades</p>
        </div>
      </div>

      {/* PENDING PROPOSALS ALERT BANNER */}
      {pendingIncoming.length > 0 && (
        <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
              <Repeat className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">
                You have {pendingIncoming.length} new skill exchange {pendingIncoming.length === 1 ? 'proposal' : 'proposals'} awaiting your response!
              </p>
              <p className="text-xs text-muted-foreground">
                Review skills offered in exchange and accept to start 1-on-1 collaboration.
              </p>
            </div>
          </div>
          <Link to="/exchanges?tab=incoming">
            <Button size="sm" className="bg-primary text-primary-foreground font-semibold text-xs h-8">
              Review Incoming Proposals
            </Button>
          </Link>
        </div>
      )}

      {/* PROFILE COMPLETION BANNER */}
      {completionPercentage < 100 && (
        <Card className="border-primary/20 bg-primary/5 shadow-xs">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1.5 w-full sm:w-2/3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Profile Completion: {completionPercentage}%
                </span>
                <span className="text-muted-foreground">Add teaching & learning skills to unlock best matches</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
            <Link to={`/profile/${user?.id}`}>
              <Button size="sm" variant="outline" className="shrink-0 text-xs h-8">
                Complete Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* TWO COLUMNS: SKILLS (TEACH & LEARN) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* I CAN TEACH */}
        <Card className="border-border shadow-sm flex flex-col">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                I Can Teach ({teachingSkills.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Skills you offer to other members in exchange for learning
              </CardDescription>
            </div>

            <Dialog open={teachModalOpen} onOpenChange={setTeachModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Skill
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add a Skill You Can Teach</DialogTitle>
                  <DialogDescription>
                    Select an existing skill from the catalog and set your expertise.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddTeaching} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Skill Catalog *</Label>
                    <Select value={teachSkillId} onValueChange={setTeachSkillId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a skill or select Other..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__other__" className="font-semibold text-primary">
                          ✨ Other (Add Custom Skill)
                        </SelectItem>
                        {availableSkills.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({s.category?.name || 'General'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {teachSkillId === '__other__' && (
                    <div className="space-y-1.5 p-3 rounded-lg border border-primary/40 bg-primary/5 animate-in fade-in">
                      <Label className="text-xs font-semibold text-foreground">Custom Skill Name *</Label>
                      <Input
                        placeholder="e.g. Sourdough Bread Baking, Vedic Math, Rust..."
                        value={customTeachName}
                        onChange={(e) => setCustomTeachName(e.target.value)}
                        className="h-8 text-xs bg-background"
                        required
                        autoFocus
                      />
                      <p className="text-[11px] text-muted-foreground">
                        This skill will be immediately added to the catalog and power your peer matches.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Proficiency Level</Label>
                      <Select value={teachLevel} onValueChange={setTeachLevel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                          <SelectItem value="Expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Years of Experience</Label>
                      <Input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={teachExp}
                        onChange={(e) => setTeachExp(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Format Preference</Label>
                    <Select value={teachFormat} onValueChange={setTeachFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Online">Online Video / Screen Share</SelectItem>
                        <SelectItem value="In-Person">In-Person Meeting</SelectItem>
                        <SelectItem value="Both">Both Online & In-Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>What can you help peers accomplish?</Label>
                    <Textarea
                      placeholder="e.g. Can walk through setting up production projects, review code, or teach fundamentals..."
                      value={teachDesc}
                      onChange={(e) => setTeachDesc(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setTeachModalOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-primary text-primary-foreground">Save Teaching Skill</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-3 flex-1">
            {teachingSkills.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-xl text-muted-foreground space-y-2">
                <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/60" />
                <p className="text-sm font-medium">No teaching skills listed yet</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Listing at least one skill lets the Smart Matching engine connect you with partners.
                </p>
                <Button size="sm" variant="outline" onClick={() => setTeachModalOpen(true)}>Add your first skill</Button>
              </div>
            ) : (
              teachingSkills.map((ts) => (
                <div key={ts.id} className="p-3 bg-muted/40 border border-border/80 rounded-lg flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{ts.skill?.name || 'Skill'}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {ts.proficiency_level}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{ts.experience_years} yrs exp</span>
                    </div>
                    {ts.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{ts.description}</p>
                    )}
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                      <span>Format: {ts.format}</span>
                      <span>•</span>
                      <span className="text-primary flex items-center gap-1 font-medium">
                        <Award className="h-3 w-3" /> {ts.endorsements_count || 0} endorsements
                      </span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveTeaching(ts.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* I WANT TO LEARN */}
        <Card className="border-border shadow-sm flex flex-col">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                I Want to Learn ({learningSkills.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Skills you want peers to mentor you on in exchange
              </CardDescription>
            </div>

            <Dialog open={learnModalOpen} onOpenChange={setLearnModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add a Learning Goal</DialogTitle>
                  <DialogDescription>
                    Specify what you wish to learn so compatible mentors can find you.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddLearning} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Skill Catalog *</Label>
                    <Select value={learnSkillId} onValueChange={setLearnSkillId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a skill or select Other..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__other__" className="font-semibold text-primary">
                          ✨ Other (Add Custom Skill)
                        </SelectItem>
                        {availableSkills.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({s.category?.name || 'General'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {learnSkillId === '__other__' && (
                    <div className="space-y-1.5 p-3 rounded-lg border border-primary/40 bg-primary/5 animate-in fade-in">
                      <Label className="text-xs font-semibold text-foreground">Custom Learning Goal *</Label>
                      <Input
                        placeholder="e.g. Japanese Kanji, Unreal Engine, Latin, Pottery..."
                        value={customLearnName}
                        onChange={(e) => setCustomLearnName(e.target.value)}
                        className="h-8 text-xs bg-background"
                        required
                        autoFocus
                      />
                      <p className="text-[11px] text-muted-foreground">
                        This custom learning goal will be visible to mentors and matching algorithms.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Current Level</Label>
                      <Select value={learnCurrent} onValueChange={setLearnCurrent}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Target Level</Label>
                      <Select value={learnTarget} onValueChange={setLearnTarget}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                          <SelectItem value="Expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Learning Priority</Label>
                    <Select value={learnPriority} onValueChange={setLearnPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High (actively seeking exchange)</SelectItem>
                        <SelectItem value="Medium">Medium (flexible schedule)</SelectItem>
                        <SelectItem value="Low">Low (future interest)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Learning Goals & Focus Areas</Label>
                    <Textarea
                      placeholder="e.g. Want to learn conversation for travel, or build a personal project from scratch..."
                      value={learnNotes}
                      onChange={(e) => setLearnNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setLearnModalOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-primary text-primary-foreground">Save Learning Goal</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-3 flex-1">
            {learningSkills.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-xl text-muted-foreground space-y-2">
                <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/60" />
                <p className="text-sm font-medium">No learning goals defined</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Tell the platform what you want to learn so peers can propose exchanges.
                </p>
                <Button size="sm" variant="outline" onClick={() => setLearnModalOpen(true)}>Add your first goal</Button>
              </div>
            ) : (
              learningSkills.map((ls) => (
                <div key={ls.id} className="p-3 bg-muted/40 border border-border/80 rounded-lg flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{ls.skill?.name || 'Skill'}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-600 dark:text-amber-400">
                        {ls.current_level} → {ls.target_level}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {ls.priority} Priority
                      </Badge>
                    </div>
                    {ls.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{ls.notes}</p>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveLearning(ls.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* PENDING INCOMING EXCHANGE REQUESTS */}
      {pendingIncoming.length > 0 && (
        <Card className="border-primary/40 bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
              <Repeat className="h-4 w-4" />
              Incoming Exchange Proposals ({pendingIncoming.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Peers who want to learn a skill you teach in return for teaching you their skill.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingIncoming.map((req) => (
              <div key={req.id} className="p-4 bg-muted/30 border border-border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <img
                    src={req.sender?.avatar_url || 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_660e9ae4-2f78-4f2b-8de1-1547d1387ee9.jpg'}
                    alt={req.sender?.full_name || 'Sender'}
                    className="w-10 h-10 rounded-full object-cover border border-border shrink-0 mt-0.5"
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {req.sender?.full_name || req.sender?.username || 'Peer Learner'}
                      <span className="text-xs font-normal text-muted-foreground ml-2">({req.sender?.location || 'Global'})</span>
                    </p>
                    <p className="text-xs text-foreground font-medium">
                      They teach: <span className="text-primary">{req.teach_skill?.name || 'Their Skill'}</span> • You teach: <span className="text-emerald-600 dark:text-emerald-400">{req.learn_skill?.name || 'Your Skill'}</span>
                    </p>
                    <p className="text-xs text-muted-foreground italic bg-background/80 p-2 rounded-md border border-border/60">
                      "{req.proposal_message}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Button size="sm" variant="outline" className="text-xs h-8 text-destructive hover:bg-destructive/10" onClick={() => handleRejectRequest(req.id)}>
                    Decline
                  </Button>
                  <Button size="sm" className="text-xs h-8 bg-primary text-primary-foreground font-semibold" onClick={() => handleAcceptRequest(req.id)}>
                    Accept Exchange
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* TOP SMART MATCHES PREVIEW */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Recommended Smart Matches
            </CardTitle>
            <CardDescription className="text-xs">
              Direct reciprocal pairings calculated by compatibility of skills and availability
            </CardDescription>
          </div>
          <Link to="/matches">
            <Button variant="ghost" size="sm" className="h-8 text-xs text-primary gap-1">
              Explore All Matches <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Add more skills you can teach and want to learn to generate tailored recommendations.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {matches.map((m) => (
                <div key={m.member.id} className="p-4 bg-card border border-border rounded-xl space-y-3 flex flex-col justify-between hover:border-primary/40 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={m.member.avatar_url || 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_660e9ae4-2f78-4f2b-8de1-1547d1387ee9.jpg'}
                          alt={m.member.full_name || 'Member'}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-semibold text-foreground truncate max-w-[120px]">{m.member.full_name || m.member.username}</p>
                          <p className="text-[11px] text-muted-foreground">{m.member.location || 'Global'}</p>
                        </div>
                      </div>
                      <Badge className="bg-primary text-primary-foreground font-bold text-xs">
                        {m.compatibilityScore}%
                      </Badge>
                    </div>

                    <div className="text-xs space-y-1 pt-1">
                      {m.skillsTheyTeachYouWant.length > 0 && (
                        <p className="text-[11px]">
                          <span className="text-muted-foreground">Teaches:</span>{' '}
                          <span className="font-medium text-foreground">{m.skillsTheyTeachYouWant[0].name}</span>
                        </p>
                      )}
                      {m.skillsYouTeachTheyWant.length > 0 && (
                        <p className="text-[11px]">
                          <span className="text-muted-foreground">Wants:</span>{' '}
                          <span className="font-medium text-primary">{m.skillsYouTeachTheyWant[0].name}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <Link to={`/profile/${m.member.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2">Profile</Button>
                    </Link>
                    <Link to="/matches">
                      <Button size="sm" className="h-7 text-xs bg-primary text-primary-foreground">Propose</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* UPCOMING SESSIONS CALENDAR PREVIEW */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Upcoming Scheduled Sessions ({upcomingSessions.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Live peer mentoring sessions confirmed on your calendar
            </CardDescription>
          </div>
          <Link to="/sessions">
            <Button variant="ghost" size="sm" className="h-8 text-xs text-primary gap-1">
              Open Calendar <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground space-y-2">
              <p>No upcoming sessions scheduled right now.</p>
              <Link to="/exchanges">
                <Button size="sm" variant="outline" className="text-xs">Go to Exchanges to schedule</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((sess) => {
                const isTeacher = sess.teacher_id === user?.id;
                const partner = isTeacher ? sess.learner : sess.teacher;
                return (
                  <div key={sess.id} className="p-3.5 bg-muted/40 border border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{sess.title}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary text-primary">
                          {sess.skill?.name || 'Session'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-3">
                        <span>Date: {sess.session_date} ({sess.start_time} - {sess.end_time})</span>
                        <span>•</span>
                        <span>Partner: {partner?.full_name || partner?.username || 'Peer'}</span>
                        <span>•</span>
                        <span>Role: {isTeacher ? 'Teacher' : 'Learner'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {sess.meeting_link && (
                        <a href={sess.meeting_link} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="h-8 text-xs bg-primary text-primary-foreground font-semibold gap-1.5">
                            <Video className="h-3.5 w-3.5" /> Join Room
                          </Button>
                        </a>
                      )}
                      <Link to="/sessions">
                        <Button size="sm" variant="outline" className="h-8 text-xs">Details</Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {user && (
        <AvatarUploadDialog
          open={avatarDialogOpen}
          onOpenChange={setAvatarDialogOpen}
          userId={user.id}
          currentAvatarUrl={profile?.avatar_url}
          onAvatarUpdated={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
