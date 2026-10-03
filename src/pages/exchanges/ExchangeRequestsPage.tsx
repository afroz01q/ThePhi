import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Repeat,
  ArrowLeftRight,
  MessageSquare,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Video,
  MapPin,
  ShieldCheck,
  Building,
} from 'lucide-react';
import {
  fetchExchangeRequests,
  updateExchangeStatus,
  createSession,
} from '@/api/skillxchange';
import type { ExchangeRequest } from '@/types/types';
import { toast } from 'sonner';

export function ExchangeRequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ExchangeRequest[]>([]);
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'active');

  // Schedule modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<ExchangeRequest | null>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionFormat, setSessionFormat] = useState<'Online' | 'In-Person'>('Online');
  const [sessionDate, setSessionDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:00');
  const [virtualPlatform, setVirtualPlatform] = useState('Jitsi Meet');
  const [meetingLink, setMeetingLink] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationNotes, setLocationNotes] = useState('');
  const [safetyNotes, setSafetyNotes] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const loadRequests = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchExchangeRequests(user.id);
      setRequests(data);

      // Auto-focus incoming if requested via URL or if incoming exists with no active
      const tabFromUrl = searchParams.get('tab');
      if (tabFromUrl && ['active', 'incoming', 'outgoing', 'history'].includes(tabFromUrl)) {
        setActiveTab(tabFromUrl);
      } else {
        const incoming = data.filter((r) => r.receiver_id === user.id && r.status === 'pending');
        const active = data.filter((r) => r.status === 'accepted');
        if (incoming.length > 0 && active.length === 0) {
          setActiveTab('incoming');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user, searchParams]);

  const handleStatusChange = async (requestId: string, status: 'accepted' | 'rejected' | 'cancelled' | 'completed') => {
    try {
      await updateExchangeStatus(requestId, status);
      toast.success(`Exchange status updated to ${status}`);
      loadRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update exchange');
    }
  };

  const handleOpenSchedule = (req: ExchangeRequest) => {
    setSelectedExchange(req);
    const partnerName = req.sender_id === user?.id ? req.receiver?.full_name : req.sender?.full_name;
    const skillName = req.sender_id === user?.id ? req.learn_skill?.name : req.teach_skill?.name;
    setSessionTitle(`${skillName || 'Skill'} Session with ${partnerName || 'Peer'}`);
    setSessionFormat(req.preferred_format === 'In-Person' ? 'In-Person' : 'Online');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSessionDate(tomorrow.toISOString().split('T')[0]);
    setMeetingLink(`https://meet.jit.si/skillxchange-${Math.random().toString(36).substring(7)}`);
    setVirtualPlatform('Jitsi Meet');
    setLocationName('');
    setLocationAddress('');
    setLocationNotes('');
    setSafetyNotes('Meet in a public place (e.g. library or coffee shop). Confirm identity before meeting.');
    setScheduleModalOpen(true);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExchange || !user) return;
    if (!sessionDate || !startTime || !endTime) {
      toast.error('Please enter all schedule details');
      return;
    }

    if (sessionFormat === 'In-Person' && !locationName.trim()) {
      toast.error('Please provide a public location name for in-person sessions');
      return;
    }

    if (sessionFormat === 'Online' && !meetingLink.trim()) {
      toast.error('Please provide a meeting URL for online sessions');
      return;
    }

    setScheduling(true);
    try {
      const isSender = selectedExchange.sender_id === user.id;
      const teacherId = isSender ? selectedExchange.sender_id : selectedExchange.receiver_id;
      const learnerId = isSender ? selectedExchange.receiver_id : selectedExchange.sender_id;
      const skillId = isSender ? selectedExchange.teach_skill_id : selectedExchange.learn_skill_id;

      await createSession({
        exchange_id: selectedExchange.id,
        teacher_id: teacherId,
        learner_id: learnerId,
        skill_id: skillId || '',
        title: sessionTitle,
        session_date: sessionDate,
        start_time: startTime,
        end_time: endTime,
        format: sessionFormat,
        meeting_link: sessionFormat === 'Online' ? meetingLink : undefined,
        virtual_platform: sessionFormat === 'Online' ? virtualPlatform : undefined,
        location_name: sessionFormat === 'In-Person' ? locationName : undefined,
        location_address: sessionFormat === 'In-Person' ? locationAddress : undefined,
        location_notes: locationNotes,
        safety_notes: safetyNotes,
      });

      toast.success('Session scheduled and added to your calendar!');
      setScheduleModalOpen(false);
      navigate('/sessions');
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule session');
    } finally {
      setScheduling(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <Repeat className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-xl font-bold">Please sign in to view your skill exchanges</h2>
        <Link to="/login"><Button>Sign In</Button></Link>
      </div>
    );
  }

  const incomingRequests = requests.filter((r) => r.receiver_id === user.id && r.status === 'pending');
  const outgoingRequests = requests.filter((r) => r.sender_id === user.id && r.status === 'pending');
  const activeExchanges = requests.filter((r) => r.status === 'accepted');
  const completedHistory = requests.filter((r) => r.status === 'completed' || r.status === 'rejected' || r.status === 'cancelled');

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <span className="ed-meta">Exchange Ledger</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-1">
            Skill Exchanges & Proposals
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-sans">
            Track reciprocal learning partnerships, review incoming proposals, and coordinate collaborative sessions.
          </p>
        </div>

        <Link to="/explore">
          <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 font-semibold text-xs uppercase tracking-wider gap-1.5 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Find New Partner
          </Button>
        </Link>
      </div>

      {/* Prominent Incoming Proposals Alert */}
      {incomingRequests.length > 0 && (
        <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
              <Repeat className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">
                You have {incomingRequests.length} incoming exchange {incomingRequests.length === 1 ? 'proposal' : 'proposals'} awaiting your review!
              </p>
              <p className="text-xs text-muted-foreground">
                Peers want to exchange their skills for your expertise. Review and accept to unlock direct messaging and live sessions.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setActiveTab('incoming')}
            className="shrink-0 text-xs bg-primary text-primary-foreground font-semibold h-8"
          >
            Review Proposals ({incomingRequests.length})
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="active" className="text-xs">
            Active Exchanges ({activeExchanges.length})
          </TabsTrigger>
          <TabsTrigger value="incoming" className="text-xs">
            Incoming ({incomingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="text-xs">
            Outgoing Sent ({outgoingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">
            History ({completedHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* ACTIVE EXCHANGES */}
        <TabsContent value="active" className="space-y-4">
          {activeExchanges.length === 0 ? (
            <Card className="border-dashed border-border py-12 text-center text-muted-foreground space-y-3">
              <p className="font-semibold text-base">No active exchanges right now</p>
              <p className="text-xs max-w-md mx-auto">
                Once a proposal is accepted by either you or your partner, the exchange becomes active and unlocks 1-on-1 chat and session scheduling.
              </p>
              <Link to="/matches"><Button variant="outline" size="sm">Browse Recommended Matches</Button></Link>
            </Card>
          ) : (
            activeExchanges.map((ex) => {
              const isSender = ex.sender_id === user.id;
              const partner = isSender ? ex.receiver : ex.sender;
              const myTeach = isSender ? ex.teach_skill : ex.learn_skill;
              const partnerTeach = isSender ? ex.learn_skill : ex.teach_skill;

              return (
                <Card key={ex.id} className="border-border shadow-xs hover:border-primary/40 transition-colors">
                  <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={partner?.avatar_url || 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_660e9ae4-2f78-4f2b-8de1-1547d1387ee9.jpg'}
                        alt={partner?.full_name || 'Partner'}
                        className="w-12 h-12 rounded-full object-cover border border-border shrink-0 mt-0.5"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link to={`/profile/${partner?.id}`} className="hover:underline">
                            <h3 className="font-bold text-base text-foreground">
                              {partner?.full_name || partner?.username}
                            </h3>
                          </Link>
                          <Badge className="bg-emerald-600 text-white text-[10px]">Active Exchange</Badge>
                        </div>

                        <div className="text-xs space-y-0.5">
                          <p>
                            <span className="text-muted-foreground">You teach:</span>{' '}
                            <strong className="text-emerald-600 dark:text-emerald-400">{myTeach?.name || 'Skill'}</strong>
                          </p>
                          <p>
                            <span className="text-muted-foreground">They teach you:</span>{' '}
                            <strong className="text-primary">{partnerTeach?.name || 'Skill'}</strong>
                          </p>
                        </div>

                        {ex.proposal_message && (
                          <p className="text-xs text-muted-foreground italic pt-1">
                            "{ex.proposal_message}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
                      <Link to="/chat">
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" /> Chat
                        </Button>
                      </Link>

                      <Link to={`/progress?exchangeId=${ex.id}`}>
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5">
                          <TrendingUp className="h-3.5 w-3.5" /> Progress
                        </Button>
                      </Link>

                      <Button
                        size="sm"
                        className="h-8 text-xs bg-primary text-primary-foreground font-semibold gap-1.5 shadow-xs"
                        onClick={() => handleOpenSchedule(ex)}
                      >
                        <Calendar className="h-3.5 w-3.5" /> Schedule Session
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs text-muted-foreground hover:text-emerald-600"
                        onClick={() => handleStatusChange(ex.id, 'completed')}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Complete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* INCOMING PROPOSALS */}
        <TabsContent value="incoming" className="space-y-4">
          {incomingRequests.length === 0 ? (
            <Card className="border-dashed border-border py-10 text-center text-muted-foreground space-y-2">
              <p className="text-sm font-medium">No pending incoming proposals</p>
              <p className="text-xs">When other members request to trade skills with you, they will appear here.</p>
            </Card>
          ) : (
            incomingRequests.map((req) => (
              <Card key={req.id} className="border-primary/40 shadow-xs">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={req.sender?.avatar_url || 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_660e9ae4-2f78-4f2b-8de1-1547d1387ee9.jpg'}
                      alt="Sender"
                      className="w-10 h-10 rounded-full object-cover border border-border"
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground">
                        {req.sender?.full_name || req.sender?.username} wants to exchange skills
                      </p>
                      <p className="text-xs text-muted-foreground">
                        They offer: <span className="font-semibold text-primary">{req.teach_skill?.name}</span> • They want: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{req.learn_skill?.name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground italic bg-muted/40 p-2 rounded-md">
                        "{req.proposal_message}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 text-destructive hover:bg-destructive/10"
                      onClick={() => handleStatusChange(req.id, 'rejected')}
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs h-8 bg-primary text-primary-foreground font-semibold"
                      onClick={() => handleStatusChange(req.id, 'accepted')}
                    >
                      Accept Exchange
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* OUTGOING REQUESTS */}
        <TabsContent value="outgoing" className="space-y-4">
          {outgoingRequests.length === 0 ? (
            <Card className="border-dashed border-border py-10 text-center text-muted-foreground space-y-2">
              <p className="text-sm font-medium">No pending sent proposals</p>
              <Link to="/explore"><Button variant="outline" size="sm">Browse skills to propose an exchange</Button></Link>
            </Card>
          ) : (
            outgoingRequests.map((req) => (
              <Card key={req.id} className="border-border shadow-xs">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Proposal to {req.receiver?.full_name || req.receiver?.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You offered: <span className="text-emerald-600 dark:text-emerald-400 font-medium">{req.teach_skill?.name}</span> • Desired: <span className="text-primary font-medium">{req.learn_skill?.name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground italic">"{req.proposal_message}"</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleStatusChange(req.id, 'cancelled')}
                  >
                    Cancel Proposal
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* HISTORY */}
        <TabsContent value="history" className="space-y-3">
          {completedHistory.length === 0 ? (
            <Card className="border-dashed border-border py-8 text-center text-muted-foreground text-xs">
              No completed or past exchanges yet.
            </Card>
          ) : (
            completedHistory.map((ex) => (
              <Card key={ex.id} className="border-border shadow-xs bg-muted/20">
                <CardContent className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-foreground">
                      Exchange with {ex.sender_id === user.id ? ex.receiver?.full_name : ex.sender?.full_name}
                    </span>
                    <p className="text-muted-foreground mt-0.5">
                      Skills: {ex.teach_skill?.name} ⇄ {ex.learn_skill?.name}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {ex.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* SCHEDULE SESSION MODAL */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Schedule Peer Learning Session
            </DialogTitle>
            <DialogDescription>
              Book an online video conference or an in-person meeting slot with your exchange partner.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSession} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Session Title</Label>
              <Input
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                required
              />
            </div>

            {/* Session Format: Online vs In-Person */}
            <div className="space-y-2">
              <Label>Session Format</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSessionFormat('Online')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all ${
                    sessionFormat === 'Online'
                      ? 'border-primary bg-primary/10 text-primary shadow-xs'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Video className="h-4 w-4" /> Online (Virtual)
                </button>
                <button
                  type="button"
                  onClick={() => setSessionFormat('In-Person')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all ${
                    sessionFormat === 'In-Person'
                      ? 'border-primary bg-primary/10 text-primary shadow-xs'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <MapPin className="h-4 w-4" /> In-Person (Physical)
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* ONLINE SESSION FIELDS */}
            {sessionFormat === 'Online' && (
              <div className="space-y-3 p-3.5 rounded-lg bg-muted/40 border border-border/80">
                <div className="space-y-1.5">
                  <Label className="text-xs">Virtual Platform</Label>
                  <Select value={virtualPlatform} onValueChange={setVirtualPlatform}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Jitsi Meet">Jitsi Meet (Instant Free Room)</SelectItem>
                      <SelectItem value="Google Meet">Google Meet</SelectItem>
                      <SelectItem value="Zoom">Zoom Meeting</SelectItem>
                      <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Meeting Room Link</Label>
                  <Input
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://..."
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Both participants can join directly from the Sessions calendar.
                  </p>
                </div>
              </div>
            )}

            {/* IN-PERSON SESSION FIELDS */}
            {sessionFormat === 'In-Person' && (
              <div className="space-y-3 p-3.5 rounded-lg bg-muted/40 border border-border/80">
                <div className="space-y-1.5">
                  <Label className="text-xs">Public Venue / Location Name</Label>
                  <Input
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g. Downtown Central Library (Study Room 2)"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Physical Address / Area</Label>
                  <Input
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    placeholder="e.g. 500 Market St, Floor 2"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Meeting Spot & Arrival Notes</Label>
                  <Input
                    value={locationNotes}
                    onChange={(e) => setLocationNotes(e.target.value)}
                    placeholder="e.g. Near main inquiry desk; wearing green backpack"
                  />
                </div>

                {/* SAFETY ADVISORY */}
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 flex items-start gap-2 text-[11px] text-foreground">
                  <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold text-amber-700 dark:text-amber-300">Safety Advisory:</strong>
                    <p className="text-muted-foreground mt-0.5">
                      Always meet in busy public venues (libraries, cafes, campus centers). Let someone know your schedule.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setScheduleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={scheduling} className="bg-primary text-primary-foreground font-semibold">
                {scheduling ? 'Booking...' : 'Confirm Session'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
