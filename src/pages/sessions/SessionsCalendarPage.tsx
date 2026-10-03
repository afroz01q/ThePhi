import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  XCircle,
  Star,
  Sparkles,
  User,
  ArrowRight,
  MapPin,
  ShieldCheck,
  Building,
  ExternalLink,
  Info,
} from 'lucide-react';
import {
  fetchUserSessions,
  updateSessionStatus,
  submitReview,
} from '@/api/skillxchange';
import type { Session } from '@/types/types';
import { toast } from 'sonner';

export function SessionsCalendarPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState('upcoming');

  // Review Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSession, setReviewSession] = useState<Session | null>(null);
  const [rating, setRating] = useState(5);
  const [knowledgeRating, setKnowledgeRating] = useState(5);
  const [commRating, setCommRating] = useState(5);
  const [punctRating, setPunctRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadSessions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchUserSessions(user.id);
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [user]);

  const handleCompleteSession = (sess: Session) => {
    setReviewSession(sess);
    setRating(5);
    setKnowledgeRating(5);
    setCommRating(5);
    setPunctRating(5);
    setFeedback('');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewSession || !user) return;

    setSubmittingReview(true);
    try {
      // Mark session completed
      await updateSessionStatus(reviewSession.id, 'completed');

      // The other user is the reviewee
      const revieweeId = reviewSession.teacher_id === user.id ? reviewSession.learner_id : reviewSession.teacher_id;

      await submitReview({
        session_id: reviewSession.id,
        reviewee_id: revieweeId,
        skill_id: reviewSession.skill_id || undefined,
        rating,
        knowledge_rating: knowledgeRating,
        communication_rating: commRating,
        punctuality_rating: punctRating,
        feedback: feedback.trim(),
      });

      toast.success('Session completed and peer review published!');
      setReviewModalOpen(false);
      loadSessions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    if (confirm('Are you sure you want to cancel this scheduled session?')) {
      try {
        await updateSessionStatus(sessionId, 'cancelled');
        toast.success('Session marked as cancelled');
        loadSessions();
      } catch (err: any) {
        toast.error(err.message || 'Failed to cancel session');
      }
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingSessions = sessions.filter((s) => s.status === 'scheduled' && s.session_date >= todayStr);
  const todaySessions = sessions.filter((s) => s.status === 'scheduled' && s.session_date === todayStr);
  const completedSessions = sessions.filter((s) => s.status === 'completed');

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <span className="ed-meta">Chronological Schedule</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-1">
            Sessions & Calendar
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-sans">
            Track confirmed peer learning appointments, launch encrypted video calls, and exchange authentic ratings.
          </p>
        </div>

        <Link to="/exchanges">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold uppercase tracking-wider border-border">
            Manage Exchanges & Book Slot
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="upcoming" className="text-xs">
            Upcoming ({upcomingSessions.length})
          </TabsTrigger>
          <TabsTrigger value="today" className="text-xs">
            Today ({todaySessions.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs">
            Completed ({completedSessions.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs">
            All ({sessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {sessions.length === 0 ? (
            <Card className="border-dashed border-border py-12 text-center text-muted-foreground space-y-3">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground/60" />
              <p className="text-base font-semibold">No scheduled sessions found</p>
              <p className="text-xs max-w-sm mx-auto">
                Once you accept or propose a skill exchange, schedule live 1-on-1 sessions to practice together.
              </p>
              <Link to="/exchanges"><Button size="sm">Go to Exchanges</Button></Link>
            </Card>
          ) : (
            (activeTab === 'upcoming'
              ? upcomingSessions
              : activeTab === 'today'
              ? todaySessions
              : activeTab === 'completed'
              ? completedSessions
              : sessions
            ).map((sess) => {
              const isTeacher = sess.teacher_id === user?.id;
              const partner = isTeacher ? sess.learner : sess.teacher;

              return (
                <Card key={sess.id} className="border-border shadow-xs hover:border-primary/40 transition-colors">
                  <CardContent className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex flex-col items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                        <span className="uppercase text-[10px] tracking-wider">{new Date(sess.session_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="text-xl leading-none">{new Date(sess.session_date).getDate()}</span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-base text-foreground">{sess.title}</h3>
                          <Badge
                            variant={sess.status === 'completed' ? 'secondary' : sess.status === 'cancelled' ? 'destructive' : 'outline'}
                            className="text-[10px] capitalize"
                          >
                            {sess.status}
                          </Badge>
                          
                          {/* Format Badge */}
                          {sess.format === 'In-Person' ? (
                            <Badge className="bg-amber-600/10 text-amber-700 dark:text-amber-400 border-amber-600/30 text-[10px] gap-1">
                              <MapPin className="h-3 w-3" /> In-Person
                            </Badge>
                          ) : (
                            <Badge className="bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30 text-[10px] gap-1">
                              <Video className="h-3 w-3" /> {sess.virtual_platform || 'Online Video'}
                            </Badge>
                          )}

                          <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                            {sess.skill?.name || 'Skill Session'}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            {sess.start_time} - {sess.end_time} ({sess.duration_minutes || 60} mins)
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            Partner: <strong className="text-foreground">{partner?.full_name || partner?.username}</strong> ({isTeacher ? 'You teach' : 'You learn'})
                          </span>
                        </div>

                        {/* ONLINE VENUE DETAILS */}
                        {sess.format !== 'In-Person' && sess.meeting_link && (
                          <div className="pt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Video className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                            <span className="truncate max-w-md">Room: <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] text-foreground">{sess.meeting_link}</code></span>
                          </div>
                        )}

                        {/* IN-PERSON VENUE DETAILS */}
                        {sess.format === 'In-Person' && (
                          <div className="pt-1.5 space-y-1 text-xs">
                            <div className="flex items-center gap-1.5 font-medium text-foreground">
                              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span>{sess.location_name || 'Designated Public Venue'}</span>
                              {sess.location_address && (
                                <span className="text-muted-foreground">({sess.location_address})</span>
                              )}
                            </div>

                            {sess.location_notes && (
                              <p className="text-muted-foreground italic pl-5 text-[11px]">
                                Spot note: "{sess.location_notes}"
                              </p>
                            )}

                            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 pl-5">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>Public meetup protocol advisory active</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-start pt-2 md:pt-0">
                      {sess.status === 'scheduled' && (
                        <>
                          {sess.format !== 'In-Person' && sess.meeting_link && (
                            <a href={sess.meeting_link} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" className="h-8 text-xs bg-primary text-primary-foreground font-semibold gap-1.5 shadow-xs">
                                <Video className="h-3.5 w-3.5" /> Join Room
                              </Button>
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 text-xs font-semibold gap-1"
                            onClick={() => handleCompleteSession(sess)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            Mark Complete & Rate
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-muted-foreground hover:text-destructive"
                            onClick={() => handleCancelSession(sess.id)}
                          >
                            Cancel
                          </Button>
                        </>
                      )}

                      {sess.status === 'completed' && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="h-4 w-4" /> Completed & Reviewed
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* REVIEW & RATING MODAL */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              Session Completed! Review Your Peer
            </DialogTitle>
            <DialogDescription>
              Your authentic feedback builds community trust and updates their verified reputation score.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitReview} className="space-y-4 pt-2">
            {/* Overall Rating */}
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Overall Experience Rating</span>
                <span className="text-amber-500 font-bold">{rating} / 5 Stars</span>
              </Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        star <= rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Dimensions */}
            <div className="space-y-3 bg-muted/40 p-3 rounded-xl border border-border">
              <div className="flex items-center justify-between text-xs">
                <span>Teaching Knowledge & Clarity:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setKnowledgeRating(s)}
                      className={`w-6 h-6 rounded text-xs font-bold ${
                        s === knowledgeRating ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span>Communication & Helpfulness:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setCommRating(s)}
                      className={`w-6 h-6 rounded text-xs font-bold ${
                        s === commRating ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span>Punctuality & Reliability:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPunctRating(s)}
                      className={`w-6 h-6 rounded text-xs font-bold ${
                        s === punctRating ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Qualitative Feedback */}
            <div className="space-y-2">
              <Label>Written Review & Comments</Label>
              <Textarea
                placeholder="What did you learn? How was their teaching style or collaboration?"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submittingReview} className="bg-primary text-primary-foreground font-semibold">
                {submittingReview ? 'Submitting...' : 'Publish Verified Review'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
