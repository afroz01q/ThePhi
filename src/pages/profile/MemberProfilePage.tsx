import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  User,
  Star,
  MapPin,
  Clock,
  Shield,
  ArrowLeftRight,
  Award,
  Calendar,
  MessageSquare,
  AlertTriangle,
  Ban,
  ThumbsUp,
  CheckCircle2,
  Camera,
  UserPlus,
  UserCheck,
  SlidersHorizontal,
  Globe,
  Lock,
  Plus,
} from 'lucide-react';
import {
  fetchMemberDetails,
  createExchangeRequest,
  submitEndorsement,
  submitReport,
  blockUser,
  fetchSkills,
  getConnectionStateBetween,
  sendConnectionRequest,
  respondToConnection,
} from '@/api/skillxchange';
import { supabase } from '@/db/supabase';
import { AvatarUploadDialog } from '@/components/profile/AvatarUploadDialog';
import type {
  Profile,
  UserTeachingSkill,
  UserLearningSkill,
  UserAvailability,
  Review,
  SkillEndorsement,
  Skill,
} from '@/types/types';
import { toast } from 'sonner';

export function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile: myProfile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<Profile | null>(null);
  const [teachingSkills, setTeachingSkills] = useState<UserTeachingSkill[]>([]);
  const [learningSkills, setLearningSkills] = useState<UserLearningSkill[]>([]);
  const [availability, setAvailability] = useState<UserAvailability[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [endorsements, setEndorsements] = useState<SkillEndorsement[]>([]);

  // Proposal modal
  const [proposalOpen, setProposalOpen] = useState(false);
  const [myTeachingList, setMyTeachingList] = useState<UserTeachingSkill[]>([]);
  const [myTeachId, setMyTeachId] = useState('');
  const [targetLearnId, setTargetLearnId] = useState('');
  const [proposalMsg, setProposalMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Endorsement modal
  const [endorseOpen, setEndorseOpen] = useState(false);
  const [endorseSkillId, setEndorseSkillId] = useState('');
  const [endorseComment, setEndorseComment] = useState('');

  // Report modal
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDesc, setReportDesc] = useState('');

  // Avatar and Connections
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [connectionState, setConnectionState] = useState<{
    status: 'none' | 'pending_sent' | 'pending_received' | 'connected';
    connectionId?: string;
  }>({ status: 'none' });
  const [connecting, setConnecting] = useState(false);

  // Matching & Privacy Settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDiscovery, setSettingsDiscovery] = useState(true);
  const [settingsLocationMatching, setSettingsLocationMatching] = useState(true);
  const [settingsFormat, setSettingsFormat] = useState<'Online' | 'In-Person' | 'Both'>('Both');
  const [settingsTimezone, setSettingsTimezone] = useState('UTC');
  const [settingsCity, setSettingsCity] = useState('');
  const [settingsStateRegion, setSettingsStateRegion] = useState('');
  const [settingsCountry, setSettingsCountry] = useState('');
  const [settingsLanguages, setSettingsLanguages] = useState<string[]>(['English']);
  const [customLangInput, setCustomLangInput] = useState('');
  const [showCustomLangInput, setShowCustomLangInput] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [details, skillsCatalog] = await Promise.all([
        fetchMemberDetails(id),
        fetchSkills(),
      ]);
      setAllSkills(skillsCatalog);

      if (details) {
        setMember(details.profile);
        setTeachingSkills(details.teachingSkills);
        setLearningSkills(details.learningSkills);
        setAvailability(details.availability);
        setReviews(details.reviews);
        setEndorsements(details.endorsements);

        // Prepopulate matching & privacy settings
        setSettingsDiscovery(details.profile.discovery_enabled ?? true);
        setSettingsLocationMatching(details.profile.location_matching_enabled ?? true);
        setSettingsFormat((details.profile.preferred_format as any) || 'Both');
        setSettingsTimezone(details.profile.timezone || 'UTC');
        setSettingsCity(details.profile.city || '');
        setSettingsStateRegion(details.profile.state_region || '');
        setSettingsCountry(details.profile.country || '');
        if (details.profile.languages && details.profile.languages.length > 0) {
          setSettingsLanguages(details.profile.languages);
        } else {
          setSettingsLanguages(['English']);
        }
      }

      if (user) {
        const myDetails = await fetchMemberDetails(user.id);
        if (myDetails) {
          setMyTeachingList(myDetails.teachingSkills);
          if (myDetails.teachingSkills.length > 0) {
            setMyTeachId(myDetails.teachingSkills[0].skill_id);
          } else if (skillsCatalog.length > 0) {
            setMyTeachId(skillsCatalog[0].id);
          }
        }

        if (user.id !== id) {
          const conn = await getConnectionStateBetween(user.id, id);
          setConnectionState(conn);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, user]);

  const handleOpenProposal = () => {
    if (!user) {
      toast.error('Please sign in to propose an exchange');
      navigate('/login');
      return;
    }
    if (teachingSkills.length > 0) {
      setTargetLearnId(teachingSkills[0].skill_id);
    } else if (allSkills.length > 0) {
      setTargetLearnId(allSkills[0].id);
    }

    if (myTeachingList.length > 0) {
      setMyTeachId(myTeachingList[0].skill_id);
    } else if (allSkills.length > 1) {
      setMyTeachId(allSkills[1].id);
    }

    setProposalMsg(`Hi ${member?.full_name || member?.username}, I saw your profile and would love to exchange skills!`);
    setProposalOpen(true);
  };

  const handleConnect = async () => {
    if (!user || !member) {
      toast.error('Please sign in to connect with peers');
      navigate('/login');
      return;
    }
    setConnecting(true);
    try {
      await sendConnectionRequest(member.id);
      toast.success(`Connection request sent to ${member.full_name || member.username}!`);
      setConnectionState({ status: 'pending_sent' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to send connection request');
    } finally {
      setConnecting(false);
    }
  };

  const handleAcceptConnection = async () => {
    if (!connectionState.connectionId) return;
    setConnecting(true);
    try {
      await respondToConnection(connectionState.connectionId, 'connected');
      toast.success(`Connected with ${member?.full_name || member?.username}!`);
      setConnectionState({ status: 'connected', connectionId: connectionState.connectionId });
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept connection');
    } finally {
      setConnecting(false);
    }
  };

  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    if (!myTeachId || !targetLearnId) {
      toast.error('Please select both skills for the trade');
      return;
    }
    setSubmitting(true);
    try {
      await createExchangeRequest({
        receiver_id: member.id,
        teach_skill_id: myTeachId,
        learn_skill_id: targetLearnId,
        proposal_message: proposalMsg.trim(),
        preferred_format: 'Online',
      });
      toast.success('Skill exchange proposal sent!');
      setProposalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndorseSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !member) return;
    if (!endorseSkillId) {
      toast.error('Please select a skill to endorse');
      return;
    }
    try {
      await submitEndorsement(member.id, endorseSkillId, endorseComment);
      toast.success('Skill endorsed successfully! Thank you for validating your peer.');
      setEndorseOpen(false);
      setEndorseComment('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit endorsement');
    }
  };

  const handleReportUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !member) return;
    try {
      await submitReport({
        reported_user_id: member.id,
        target_type: 'user',
        reason: reportReason,
        description: reportDesc,
      });
      toast.success('Report submitted to moderation team for review.');
      setReportOpen(false);
      setReportDesc('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit report');
    }
  };

  const handleBlockUser = async () => {
    if (!user || !member) return;
    if (confirm(`Are you sure you want to block ${member.full_name || member.username}? They won't be able to message you or propose exchanges.`)) {
      try {
        await blockUser(member.id);
        toast.success('User blocked.');
        navigate('/explore');
      } catch (err: any) {
        toast.error(err.message || 'Failed to block user');
      }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingSettings(true);
    try {
      const locationStr = [settingsCity, settingsCountry].filter(Boolean).join(', ');
      const updates: Record<string, any> = {
        discovery_enabled: settingsDiscovery,
        location_matching_enabled: settingsLocationMatching,
        preferred_format: settingsFormat,
        timezone: settingsTimezone,
        city: settingsCity || null,
        state_region: settingsStateRegion || null,
        country: settingsCountry || null,
        location: locationStr || null,
        languages: settingsLanguages,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) throw error;
      if (member) {
        setMember({ ...member, ...updates });
      }
      toast.success('Matching & privacy preferences saved successfully!');
      setSettingsOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-4">
        <div className="h-48 rounded-xl bg-muted animate-pulse" />
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-lg font-semibold">Member not found</p>
        <Link to="/explore">
          <Button variant="outline">Back to Explore</Button>
        </Link>
      </div>
    );
  }

  const isSelf = user?.id === member.id;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      {/* PROFILE HEADER CARD */}
      <div className="ed-card border border-border/80 bg-card shadow-sm overflow-hidden">
        <div className="h-24 bg-muted/40 border-b border-border/70 flex items-center px-6">
          <span className="ed-meta">Practitioner Dossier // Official Record</span>
        </div>
        <CardContent className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 mb-4">
            <div className="flex items-end gap-4">
              <div className="relative group">
                <img
                  src={member.avatar_url || 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_660e9ae4-2f78-4f2b-8de1-1547d1387ee9.jpg'}
                  alt={member.full_name || 'Member'}
                  className="w-20 h-20 rounded-xl object-cover border-2 border-border shadow-md bg-card"
                />
                {isSelf && (
                  <button
                    type="button"
                    onClick={() => setAvatarDialogOpen(true)}
                    className="absolute inset-0 bg-black/60 text-white rounded-xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold cursor-pointer"
                    title="Change Profile Picture"
                  >
                    <Camera className="h-5 w-5 mb-0.5" />
                    <span>Change</span>
                  </button>
                )}
              </div>
              <div className="space-y-0.5 pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                    {member.full_name || member.username}
                  </h1>
                  {member.role === 'admin' && (
                    <Badge variant="outline" className="text-[10px] font-mono border-accent text-accent uppercase">Staff Admin</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono">@{member.username}</p>
              </div>
            </div>

            {/* Action Buttons */}
            {isSelf ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" className="text-xs uppercase tracking-wider gap-1.5 border-border" onClick={() => setAvatarDialogOpen(true)}>
                  <Camera className="h-3.5 w-3.5 text-primary" />
                  Change Profile Pic
                </Button>
                <Link to="/availability">
                  <Button size="sm" variant="outline" className="text-xs uppercase tracking-wider gap-1.5 border-border">
                    <Clock className="h-3.5 w-3.5" />
                    Schedule Availability
                  </Button>
                </Link>
                <Button size="sm" variant="outline" className="text-xs uppercase tracking-wider gap-1.5 border-border" onClick={() => setSettingsOpen(true)}>
                  <SlidersHorizontal className="h-3.5 w-3.5 text-accent" />
                  Matching & Privacy
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {/* Connection Status Button */}
                {connectionState.status === 'none' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs uppercase tracking-wider gap-1.5 border-border hover:bg-muted"
                    onClick={handleConnect}
                    disabled={connecting}
                  >
                    <UserPlus className="h-3.5 w-3.5 text-primary" />
                    Connect
                  </Button>
                )}
                {connectionState.status === 'pending_sent' && (
                  <Button size="sm" variant="outline" disabled className="text-xs uppercase tracking-wider gap-1.5 border-border text-muted-foreground opacity-80">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    Sent Request
                  </Button>
                )}
                {connectionState.status === 'pending_received' && (
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground text-xs uppercase tracking-wider gap-1.5 font-semibold"
                    onClick={handleAcceptConnection}
                    disabled={connecting}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    Accept Connection
                  </Button>
                )}
                {connectionState.status === 'connected' && (
                  <Link to="/connections">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1.5 py-1.5 px-3 text-xs font-semibold cursor-pointer hover:bg-emerald-500/20">
                      <UserCheck className="h-3.5 w-3.5" /> Connected Peer
                    </Badge>
                  </Link>
                )}

                <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 font-semibold text-xs uppercase tracking-wider gap-1.5 shadow-xs" onClick={handleOpenProposal}>
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  Propose Exchange
                </Button>
                <Link to="/chat">
                  <Button size="sm" variant="outline" className="text-xs uppercase tracking-wider gap-1.5 border-border">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Chat
                  </Button>
                </Link>
                <Button size="sm" variant="outline" onClick={() => setEndorseOpen(true)} className="text-xs uppercase tracking-wider gap-1 border-border">
                  <ThumbsUp className="h-3.5 w-3.5 text-accent" />
                  Endorse
                </Button>

                {/* Safety Actions */}
                <Button size="sm" variant="ghost" onClick={() => setReportOpen(true)} className="h-8 px-2 text-muted-foreground hover:text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleBlockUser} className="h-8 px-2 text-muted-foreground hover:text-destructive">
                  <Ban className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Bio & Details */}
          <div className="space-y-3 pt-2">
            {member.bio && (
              <p className="text-sm text-foreground leading-relaxed max-w-2xl">{member.bio}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
              {member.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> {member.location}
                </span>
              )}
              {member.languages && member.languages.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" /> Speaks: {member.languages.join(', ')}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" /> Trust Score: <strong className="text-foreground">{member.reputation_score || 50}/100</strong>
              </span>
              <span className="flex items-center gap-1.5 text-amber-500 font-semibold">
                <Star className="h-3.5 w-3.5 fill-amber-500" /> {member.average_rating || 5.0} ({reviews.length} reviews)
              </span>
            </div>
          </div>
        </CardContent>
      </div>

      {/* SKILLS SECTION: TEACHING VS LEARNING */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* I CAN TEACH */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Skills Offered (Teaches)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {teachingSkills.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4">No skills listed yet.</p>
            ) : (
              teachingSkills.map((ts) => (
                <div key={ts.id} className="p-3.5 bg-muted/40 border border-border/80 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground">{ts.skill?.name}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                      {ts.proficiency_level}
                    </Badge>
                  </div>
                  {ts.description && (
                    <p className="text-xs text-muted-foreground">{ts.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                    <span>{ts.experience_years} years experience • {ts.format}</span>
                    <span className="text-primary font-medium flex items-center gap-1">
                      <Award className="h-3 w-3" /> {ts.endorsements_count || 0} endorsements
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* WANTS TO LEARN */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Desired Skills (Wants to Learn)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {learningSkills.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4">No specific learning goals listed.</p>
            ) : (
              learningSkills.map((ls) => (
                <div key={ls.id} className="p-3.5 bg-muted/40 border border-border/80 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground">{ls.skill?.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-600 dark:text-amber-400">
                      Target: {ls.target_level}
                    </Badge>
                  </div>
                  {ls.notes && (
                    <p className="text-xs text-muted-foreground">{ls.notes}</p>
                  )}
                  <div className="text-[11px] text-muted-foreground pt-1">
                    Priority: <span className="font-medium text-foreground">{ls.priority}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* AVAILABILITY SCHEDULE MATRIX */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Weekly Availability Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availability.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-4">
              Member has not specified exact weekly hours yet. You can still message or propose an exchange!
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                const daySlots = availability.filter((a) => a.day_of_week === day);
                const hasSlot = daySlots.length > 0;
                return (
                  <div
                    key={day}
                    className={`p-3 rounded-xl border text-center space-y-1.5 ${
                      hasSlot ? 'bg-primary/5 border-primary/30' : 'bg-muted/20 border-border/60 opacity-60'
                    }`}
                  >
                    <p className="text-xs font-bold text-foreground">{dayNames[day].slice(0, 3)}</p>
                    {hasSlot ? (
                      daySlots.map((s, idx) => (
                        <div key={idx} className="text-[11px] text-primary font-medium">
                          {s.start_time} - {s.end_time}
                          <p className="text-[10px] text-muted-foreground">
                            {s.is_online ? 'Online' : 'In-Person'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-muted-foreground italic">Unavailable</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* VERIFIED PEER REVIEWS */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            Verified Peer Reviews ({reviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-4 text-center">
              No completed exchange reviews yet. Reviews are automatically unlocked upon completing peer sessions.
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 bg-muted/30 border border-border rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rev.reviewer?.avatar_url || 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_660e9ae4-2f78-4f2b-8de1-1547d1387ee9.jpg'}
                        alt={rev.reviewer?.full_name || 'Reviewer'}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <span className="text-xs font-semibold text-foreground">
                        {rev.reviewer?.full_name || rev.reviewer?.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      <Star className="h-3.5 w-3.5 fill-amber-500" />
                      {rev.rating}.0 / 5.0
                    </div>
                  </div>

                  {rev.feedback && (
                    <p className="text-xs text-muted-foreground italic">"{rev.feedback}"</p>
                  )}

                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                    <span>Knowledge: {rev.knowledge_rating}/5</span>
                    <span>•</span>
                    <span>Communication: {rev.communication_rating}/5</span>
                    <span>•</span>
                    <span>Punctuality: {rev.punctuality_rating}/5</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PROPOSAL MODAL */}
      <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Exchange Proposal</DialogTitle>
            <DialogDescription>
              Propose an exchange with {member.full_name || member.username}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendProposal} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Skill You Want to Learn *</Label>
              <Select value={targetLearnId} onValueChange={setTargetLearnId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select skill to learn..." />
                </SelectTrigger>
                <SelectContent>
                  {teachingSkills.length > 0 ? (
                    teachingSkills.map((ts) => (
                      <SelectItem key={ts.skill_id} value={ts.skill_id}>
                        {ts.skill?.name || 'Skill'} ({ts.proficiency_level})
                      </SelectItem>
                    ))
                  ) : (
                    allSkills.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.category?.name || 'General'})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {teachingSkills.length === 0 && (
                <p className="text-[11px] text-muted-foreground">Showing full skill catalog (peer has not tagged specific skills yet).</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Skill You Will Teach in Return *</Label>
              <Select value={myTeachId} onValueChange={setMyTeachId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select skill you will teach..." />
                </SelectTrigger>
                <SelectContent>
                  {myTeachingList.length > 0 ? (
                    myTeachingList.map((ts) => (
                      <SelectItem key={ts.skill_id} value={ts.skill_id}>
                        {ts.skill?.name || 'Skill'} ({ts.proficiency_level})
                      </SelectItem>
                    ))
                  ) : (
                    allSkills.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.category?.name || 'General'})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {myTeachingList.length === 0 && (
                <p className="text-[11px] text-muted-foreground">Showing full catalog since you haven't listed teaching skills on your profile yet.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={proposalMsg}
                onChange={(e) => setProposalMsg(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setProposalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground font-semibold">
                {submitting ? 'Sending Proposal...' : 'Send Proposal'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ENDORSE MODAL */}
      <Dialog open={endorseOpen} onOpenChange={setEndorseOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-primary" />
              Endorse {member.full_name}'s Skills
            </DialogTitle>
            <DialogDescription>
              Validate peer expertise based on your exchange experience.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEndorseSkill} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Select Skill to Endorse *</Label>
              <Select value={endorseSkillId} onValueChange={setEndorseSkillId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select skill..." />
                </SelectTrigger>
                <SelectContent>
                  {teachingSkills.map((ts) => (
                    <SelectItem key={ts.skill_id} value={ts.skill_id}>
                      {ts.skill?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Endorsement Note (Optional)</Label>
              <Textarea
                placeholder="What makes them an effective mentor in this skill?"
                value={endorseComment}
                onChange={(e) => setEndorseComment(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEndorseOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground">
                Confirm Endorsement
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* REPORT MODAL */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Report Member
            </DialogTitle>
            <DialogDescription>
              Submit an issue to our moderation team. We take community safety seriously.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReportUser} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Reason for Report *</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Commercial Spam / Unrelated Solicitations</SelectItem>
                  <SelectItem value="harassment">Harassment or Inappropriate Conduct</SelectItem>
                  <SelectItem value="fake_profile">Fake Profile or Misleading Skills</SelectItem>
                  <SelectItem value="no_show">Chronic No-Show on Scheduled Sessions</SelectItem>
                  <SelectItem value="other">Other Violation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description & Details *</Label>
              <Textarea
                placeholder="Please describe what occurred..."
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setReportOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-destructive text-destructive-foreground">
                Submit Report
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {user && (
        <AvatarUploadDialog
          open={avatarDialogOpen}
          onOpenChange={setAvatarDialogOpen}
          userId={user.id}
          currentAvatarUrl={member.avatar_url}
          onAvatarUpdated={(newUrl) => {
            setMember({ ...member, avatar_url: newUrl });
          }}
        />
      )}

      {/* MATCHING PREFERENCES & PRIVACY DIALOG */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-accent" />
              Smart Matching & Privacy Settings
            </DialogTitle>
            <DialogDescription>
              Configure how our matching engine factors your profile into smart matches and peer discovery.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSettings} className="space-y-4 pt-2">
            {/* Discovery Toggle */}
            <div className="p-3 bg-muted/40 rounded-xl border border-border/80 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">Discovery Status</p>
                <p className="text-xs text-muted-foreground">
                  Allow your profile to be recommended in Smart Matches and directory searches.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settingsDiscovery}
                onChange={(e) => setSettingsDiscovery(e.target.checked)}
                className="w-5 h-5 rounded accent-primary cursor-pointer"
              />
            </div>

            {/* Location Matching Toggle */}
            <div className="p-3 bg-muted/40 rounded-xl border border-border/80 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">Location Matching</p>
                <p className="text-xs text-muted-foreground">
                  Allow city and region proximity to be considered for in-person pairings (exact street address is never requested or shared).
                </p>
              </div>
              <input
                type="checkbox"
                checked={settingsLocationMatching}
                onChange={(e) => setSettingsLocationMatching(e.target.checked)}
                className="w-5 h-5 rounded accent-primary cursor-pointer"
              />
            </div>

            {/* Delivery Format Preference */}
            <div className="space-y-1.5">
              <Label className="text-xs">Preferred Exchange Format</Label>
              <Select value={settingsFormat} onValueChange={(v: any) => setSettingsFormat(v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Online">Online Sessions Only (Zoom/Google Meet)</SelectItem>
                  <SelectItem value="In-Person">In-Person Only</SelectItem>
                  <SelectItem value="Both">Both Online & In-Person</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Timezone */}
            <div className="space-y-1.5">
              <Label className="text-xs">Your Time Zone (Used for Availability Overlap)</Label>
              <Select value={settingsTimezone} onValueChange={setSettingsTimezone}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (US / Canada - America/New_York)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (US / Canada - America/Chicago)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (US / Canada - America/Denver)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (US / Canada - America/Los_Angeles)</SelectItem>
                  <SelectItem value="Europe/London">London / GMT (Europe/London)</SelectItem>
                  <SelectItem value="Europe/Paris">Central European Time (Paris/Berlin - Europe/Paris)</SelectItem>
                  <SelectItem value="Asia/Dubai">Gulf Standard Time (Dubai - Asia/Dubai)</SelectItem>
                  <SelectItem value="Asia/Kolkata">India Standard Time (Asia/Kolkata)</SelectItem>
                  <SelectItem value="Asia/Singapore">Singapore / Hong Kong (Asia/Singapore)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Japan Standard Time (Tokyo - Asia/Tokyo)</SelectItem>
                  <SelectItem value="Australia/Sydney">Sydney Time (Australia/Sydney)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Spoken Languages & Other Language */}
            <div className="space-y-2 pt-1 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Spoken Languages</Label>
                <span className="text-[11px] text-muted-foreground">{settingsLanguages.length} selected</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Matches with peers who share at least one spoken language get higher compatibility scoring.
              </p>

              {/* Languages pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['English', 'Spanish', 'French', 'German', 'Mandarin Chinese', 'Japanese'].map(lang => {
                  const isSelected = settingsLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setSettingsLanguages(prev =>
                          isSelected ? prev.filter(l => l !== lang) : [...prev, lang]
                        );
                      }}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary font-medium'
                          : 'bg-muted/40 text-muted-foreground border-border hover:border-foreground/40'
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}

                {/* Custom languages */}
                {settingsLanguages
                  .filter(l => !['English', 'Spanish', 'French', 'German', 'Mandarin Chinese', 'Japanese'].includes(l))
                  .map(customL => (
                    <span
                      key={customL}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-accent/15 text-accent-foreground border border-accent/40 font-medium"
                    >
                      <span>{customL}</span>
                      <button
                        type="button"
                        onClick={() => setSettingsLanguages(prev => prev.filter(l => l !== customL))}
                        className="hover:text-destructive text-muted-foreground ml-0.5"
                        title={`Remove ${customL}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>

              {/* Other Language Input */}
              <div className="flex items-center gap-2 pt-1">
                {!showCustomLangInput ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 border-dashed border-primary/50 text-primary hover:bg-primary/5"
                    onClick={() => setShowCustomLangInput(true)}
                  >
                    <Plus className="h-3 w-3" />
                    <span>Other Language</span>
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 p-1 rounded-md border border-primary/40 bg-muted/20">
                    <Input
                      placeholder="e.g. Hindi, Telugu, Portuguese, Italian..."
                      value={customLangInput}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomLangInput(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const trimmed = customLangInput.trim();
                          if (trimmed && !settingsLanguages.some(l => l.toLowerCase() === trimmed.toLowerCase())) {
                            setSettingsLanguages(prev => [...prev, trimmed]);
                            setCustomLangInput('');
                            setShowCustomLangInput(false);
                          }
                        }
                      }}
                      className="h-6 text-xs w-48 bg-background"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={() => {
                        const trimmed = customLangInput.trim();
                        if (trimmed && !settingsLanguages.some(l => l.toLowerCase() === trimmed.toLowerCase())) {
                          setSettingsLanguages(prev => [...prev, trimmed]);
                          setCustomLangInput('');
                          setShowCustomLangInput(false);
                        }
                      }}
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs px-1.5 text-muted-foreground"
                      onClick={() => {
                        setCustomLangInput('');
                        setShowCustomLangInput(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Location (City / Region / Country) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">City</Label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco"
                  value={settingsCity}
                  onChange={(e) => setSettingsCity(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-md border border-input bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Country</Label>
                <input
                  type="text"
                  placeholder="e.g. United States"
                  value={settingsCountry}
                  onChange={(e) => setSettingsCountry(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-md border border-input bg-background"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setSettingsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingSettings} className="bg-primary text-primary-foreground font-semibold">
                {savingSettings ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
