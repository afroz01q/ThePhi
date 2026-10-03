import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  TrendingUp,
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  BookOpen,
  Calendar,
  MessageSquare,
  Award,
  Trash2,
  Sparkles,
  ArrowRight,
  Save,
  Check,
  Repeat,
  FileText,
} from 'lucide-react';
import {
  fetchExchangeRequests,
  fetchUserLearningProgressList,
  saveLearningProgress,
  deleteLearningProgress,
} from '@/api/skillxchange';
import type { ExchangeRequest, LearningProgress, ProficiencyLevel } from '@/types/types';
import { toast } from 'sonner';

export function LearningProgressPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const exchangeIdParam = searchParams.get('exchangeId');

  const [loading, setLoading] = useState(true);
  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([]);
  const [progressList, setProgressList] = useState<LearningProgress[]>([]);
  const [selectedExchangeId, setSelectedExchangeId] = useState<string>('');

  // Active progress details
  const [activeProgress, setActiveProgress] = useState<LearningProgress | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [goalTitle, setGoalTitle] = useState('');
  const [startingLevel, setStartingLevel] = useState<ProficiencyLevel>('Beginner');
  const [currentLevel, setCurrentLevel] = useState<ProficiencyLevel>('Intermediate');
  const [targetLevel, setTargetLevel] = useState<ProficiencyLevel>('Advanced');
  const [milestones, setMilestones] = useState<Array<{ id?: string; title: string; completed: boolean; completed_at?: string }>>([]);
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [notes, setNotes] = useState('');
  const [hoursLogged, setHoursLogged] = useState<number>(0);
  const [sessionLogs, setSessionLogs] = useState<Array<{ id: string; date: string; hours: number; summary: string }>>([]);

  // Log session modal
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logHours, setLogHours] = useState('1.5');
  const [logSummary, setLogSummary] = useState('');

  // Save state
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allExchanges, allProgress] = await Promise.all([
        fetchExchangeRequests(user.id),
        fetchUserLearningProgressList(user.id),
      ]);

      const active = allExchanges.filter((e) => e.status === 'accepted' || e.status === 'completed');
      setExchanges(active);
      setProgressList(allProgress);

      // Select exchange
      const initialId =
        exchangeIdParam && active.some((e) => e.id === exchangeIdParam)
          ? exchangeIdParam
          : active[0]?.id || '';

      setSelectedExchangeId(initialId);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load learning data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, exchangeIdParam]);

  // Synchronize active exchange progress
  useEffect(() => {
    if (!selectedExchangeId) {
      setActiveProgress(null);
      return;
    }

    const currentExchange = exchanges.find((e) => e.id === selectedExchangeId);
    const existing = progressList.find((p) => p.exchange_id === selectedExchangeId);

    if (existing) {
      setActiveProgress(existing);
      setGoalTitle(existing.goal_title);
      setStartingLevel(existing.starting_level);
      setCurrentLevel(existing.current_level);
      setTargetLevel(existing.target_level);
      setProgressPercent(existing.progress_percent || 0);
      setMilestones(existing.milestones || []);
      setNotes(existing.notes || '');
      setHoursLogged(Number(existing.hours_logged) || 0);
      setSessionLogs((existing.session_logs as any) || []);
    } else if (currentExchange) {
      // Default template
      const isSender = currentExchange.sender_id === user?.id;
      const learnSkillName = isSender
        ? currentExchange.learn_skill?.name || 'Skill'
        : currentExchange.teach_skill?.name || 'Skill';

      setActiveProgress(null);
      setGoalTitle(`Master ${learnSkillName} through collaborative practice`);
      setStartingLevel('Beginner');
      setCurrentLevel('Beginner');
      setTargetLevel('Advanced');
      setProgressPercent(15);
      setMilestones([
        { id: '1', title: `Setup development environment & fundamental toolsets for ${learnSkillName}`, completed: true },
        { id: '2', title: 'Complete first live pair-programming & code review session', completed: false },
        { id: '3', title: 'Build and deploy a functional milestone project', completed: false },
        { id: '4', title: 'Demonstrate competency & complete reverse teaching check', completed: false },
      ]);
      setNotes('');
      setHoursLogged(1);
      setSessionLogs([
        { id: '1', date: new Date().toISOString().split('T')[0], hours: 1, summary: 'Orientation and learning goals calibration' },
      ]);
    }
  }, [selectedExchangeId, progressList, exchanges]);

  const handleSaveProgress = async () => {
    if (!selectedExchangeId || !user) return;
    setSaving(true);
    try {
      const saved = await saveLearningProgress({
        id: activeProgress?.id,
        exchange_id: selectedExchangeId,
        goal_title: goalTitle,
        starting_level: startingLevel,
        current_level: currentLevel,
        target_level: targetLevel,
        progress_percent: progressPercent,
        milestones,
        notes,
        hours_logged: hoursLogged,
        session_logs: sessionLogs,
      });

      toast.success('Learning progress and milestones saved!');
      setActiveProgress(saved);
      // Reload progress list
      const updated = await fetchUserLearningProgressList(user.id);
      setProgressList(updated);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMilestone = (index: number) => {
    const updated = [...milestones];
    const willBeCompleted = !updated[index].completed;
    updated[index].completed = willBeCompleted;
    if (willBeCompleted) {
      updated[index].completed_at = new Date().toISOString();
    } else {
      delete updated[index].completed_at;
    }
    setMilestones(updated);

    // Auto calculate recommended progress percentage
    const completedCount = updated.filter((m) => m.completed).length;
    const calcPercent = Math.round((completedCount / updated.length) * 100);
    setProgressPercent(calcPercent);
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneText.trim()) return;
    const newM = {
      id: String(Date.now()),
      title: newMilestoneText.trim(),
      completed: false,
    };
    const updated = [...milestones, newM];
    setMilestones(updated);
    setNewMilestoneText('');
  };

  const handleDeleteMilestone = (index: number) => {
    const updated = milestones.filter((_, i) => i !== index);
    setMilestones(updated);
  };

  const handleAddSessionLog = (e: React.FormEvent) => {
    e.preventDefault();
    const hrs = parseFloat(logHours) || 1;
    const newLog = {
      id: String(Date.now()),
      date: logDate,
      hours: hrs,
      summary: logSummary.trim() || 'Collaborative study & practice session',
    };
    const updatedLogs = [newLog, ...sessionLogs];
    const newTotalHours = Math.round((hoursLogged + hrs) * 10) / 10;

    setSessionLogs(updatedLogs);
    setHoursLogged(newTotalHours);
    setLogModalOpen(false);
    setLogSummary('');
    toast.success(`Logged ${hrs} learning hours! Remember to save.`);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <TrendingUp className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-xl font-bold">Please sign in to view your learning progress</h2>
        <Link to="/login"><Button>Sign In</Button></Link>
      </div>
    );
  }

  const selectedExchange = exchanges.find((e) => e.id === selectedExchangeId);
  const isSender = selectedExchange?.sender_id === user.id;
  const partner = isSender ? selectedExchange?.receiver : selectedExchange?.sender;
  const learningSkill = isSender ? selectedExchange?.learn_skill : selectedExchange?.teach_skill;
  const teachingSkill = isSender ? selectedExchange?.teach_skill : selectedExchange?.learn_skill;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <span className="ed-meta">Skill Mastery Ledger</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-1">
            Learning Progress Tracker
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-sans">
            Track milestones, record completed study hours, set proficiency roadmaps, and share notes with your exchange partners.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/exchanges">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold">
              <Repeat className="h-3.5 w-3.5" /> All Exchanges
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={handleSaveProgress}
            disabled={saving || !selectedExchangeId}
            className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground shadow-xs"
          >
            <Save className="h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save Roadmap'}
          </Button>
        </div>
      </div>

      {exchanges.length === 0 ? (
        <Card className="border-dashed border-border py-12 text-center text-muted-foreground space-y-3">
          <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/60" />
          <h3 className="text-base font-semibold text-foreground">No active skill exchanges found</h3>
          <p className="text-xs max-w-md mx-auto">
            Once you accept or start a skill exchange, you can create customized milestones, log practice hours, and track mastery together.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link to="/matches"><Button size="sm">Find Smart Matches</Button></Link>
            <Link to="/exchanges"><Button size="sm" variant="outline">View Proposals</Button></Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: Exchange Selector & Overview */}
          <div className="space-y-4 lg:col-span-1">
            <Card className="border-border shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>Active Skill Exchanges</span>
                  <Badge variant="outline" className="text-[10px]">{exchanges.length}</Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Select an exchange to track goals and milestones
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 pt-0">
                {exchanges.map((ex) => {
                  const isCurSender = ex.sender_id === user.id;
                  const p = isCurSender ? ex.receiver : ex.sender;
                  const learn = isCurSender ? ex.learn_skill?.name : ex.teach_skill?.name;
                  const isSelected = ex.id === selectedExchangeId;

                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => setSelectedExchangeId(ex.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all text-xs space-y-1 ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-xs'
                          : 'border-border/80 bg-card hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-foreground font-semibold">
                          {p?.full_name || p?.username}
                        </strong>
                        <Badge
                          variant={isSelected ? 'default' : 'secondary'}
                          className="text-[9px] capitalize"
                        >
                          {ex.status}
                        </Badge>
                      </div>

                      <div className="text-muted-foreground flex items-center gap-1.5">
                        <BookOpen className="h-3 w-3 text-primary shrink-0" />
                        <span>You learn: <strong className="text-foreground">{learn || 'Skill'}</strong></span>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            {selectedExchange && (
              <Card className="border-border shadow-xs bg-muted/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Collaboration Shortcuts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <Link to="/chat">
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2">
                      <MessageSquare className="h-3.5 w-3.5 text-primary" /> Open Chat with Partner
                    </Button>
                  </Link>
                  <Link to="/sessions">
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2">
                      <Calendar className="h-3.5 w-3.5 text-amber-500" /> View / Schedule Sessions
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT / MAIN COLUMN: Tracker details */}
          <div className="space-y-6 lg:col-span-2">
            {selectedExchange ? (
              <>
                {/* Header Card: Progress Bar & Proficiency Roadmap */}
                <Card className="border-border shadow-xs">
                  <CardContent className="p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">
                          Roadmap for: {learningSkill?.name || 'Skill Learning'}
                        </span>
                        <h2 className="text-xl font-bold font-serif text-foreground mt-0.5">
                          {goalTitle}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Exchange partner & mentor:{' '}
                          <Link to={`/profile/${partner?.id}`} className="font-semibold text-foreground hover:underline">
                            {partner?.full_name || partner?.username}
                          </Link>
                        </p>
                      </div>

                      <div className="text-right sm:text-right shrink-0">
                        <div className="text-3xl font-bold font-mono text-primary leading-none">
                          {progressPercent}%
                        </div>
                        <span className="text-[11px] text-muted-foreground">Mastery Achieved</span>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-muted-foreground">Milestone Progress</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setProgressPercent((p) => Math.max(0, p - 5))}
                            className="px-2 py-0.5 rounded text-[10px] bg-muted hover:bg-muted/80 text-foreground font-mono"
                          >
                            -5%
                          </button>
                          <button
                            type="button"
                            onClick={() => setProgressPercent((p) => Math.min(100, p + 5))}
                            className="px-2 py-0.5 rounded text-[10px] bg-muted hover:bg-muted/80 text-foreground font-mono"
                          >
                            +5%
                          </button>
                        </div>
                      </div>

                      <div className="h-3 w-full bg-muted rounded-full overflow-hidden p-0.5 border border-border">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Proficiency Levels: Starting -> Current -> Target */}
                    <div className="grid grid-cols-3 gap-3 pt-1">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase font-mono">Starting Level</Label>
                        <Select value={startingLevel} onValueChange={(v: any) => setStartingLevel(v)}>
                          <SelectTrigger className="text-xs h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-primary uppercase font-mono font-bold">Current Level</Label>
                        <Select value={currentLevel} onValueChange={(v: any) => setCurrentLevel(v)}>
                          <SelectTrigger className="text-xs h-8 border-primary/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-mono font-bold">Target Level</Label>
                        <Select value={targetLevel} onValueChange={(v: any) => setTargetLevel(v)}>
                          <SelectTrigger className="text-xs h-8 border-emerald-600/40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Stats summary banner */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-border/60">
                      <div className="p-3 bg-muted/40 rounded-lg">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">Milestones Done</span>
                        <div className="text-lg font-bold text-foreground">
                          {milestones.filter((m) => m.completed).length} / {milestones.length}
                        </div>
                      </div>

                      <div className="p-3 bg-muted/40 rounded-lg">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">Practice Hours</span>
                        <div className="text-lg font-bold text-primary flex items-center gap-1.5">
                          <Clock className="h-4 w-4" /> {hoursLogged} hrs
                        </div>
                      </div>

                      <div className="p-3 bg-muted/40 rounded-lg col-span-2 sm:col-span-1 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">Logs Logged</span>
                          <div className="text-lg font-bold text-foreground">{sessionLogs.length} entries</div>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 text-xs font-semibold gap-1"
                          onClick={() => setLogModalOpen(true)}
                        >
                          <Plus className="h-3.5 w-3.5" /> Log Hours
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Milestones Checklist Card */}
                <Card className="border-border shadow-xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        Learning Milestones Checklist
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {milestones.filter((m) => m.completed).length} completed
                      </span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Check off achievements as you and your partner practice together.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {milestones.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-4 text-center">
                          No milestones added yet. Create your first milestone below!
                        </p>
                      ) : (
                        milestones.map((m, idx) => (
                          <div
                            key={m.id || idx}
                            className={`flex items-start justify-between gap-3 p-3 rounded-lg border transition-all text-xs ${
                              m.completed
                                ? 'bg-emerald-500/5 border-emerald-500/30 text-muted-foreground'
                                : 'bg-card border-border hover:border-primary/40 text-foreground'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleMilestone(idx)}
                              className="flex items-start gap-3 text-left flex-1"
                            >
                              {m.completed ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground hover:text-primary shrink-0 mt-0.5" />
                              )}
                              <div>
                                <span className={m.completed ? 'line-through text-muted-foreground' : 'font-medium'}>
                                  {m.title}
                                </span>
                                {m.completed_at && (
                                  <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                                    Completed on {new Date(m.completed_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => handleDeleteMilestone(idx)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Milestone Form */}
                    <form onSubmit={handleAddMilestone} className="flex gap-2 pt-2">
                      <Input
                        value={newMilestoneText}
                        onChange={(e) => setNewMilestoneText(e.target.value)}
                        placeholder="Add a new milestone (e.g. Master React Hooks & Context)..."
                        className="text-xs"
                      />
                      <Button type="submit" size="sm" variant="secondary" className="gap-1 text-xs shrink-0 font-semibold">
                        <Plus className="h-3.5 w-3.5" /> Add
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Session Practice Logs */}
                <Card className="border-border shadow-xs">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Session Hours & Activity Logs
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Keep an auditable ledger of hours and topics practiced.
                      </CardDescription>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1 font-semibold"
                      onClick={() => setLogModalOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Log Entry
                    </Button>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {sessionLogs.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-3 text-center">
                        No session hours logged yet. Click "Add Log Entry" to record your first study time.
                      </p>
                    ) : (
                      sessionLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/80 bg-muted/20 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {log.date}
                              </Badge>
                              <span className="font-bold text-primary">{log.hours} hours</span>
                            </div>
                            <p className="text-foreground">{log.summary}</p>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => {
                              const updated = sessionLogs.filter((l) => l.id !== log.id);
                              setSessionLogs(updated);
                              setHoursLogged((prev) => Math.max(0, Math.round((prev - log.hours) * 10) / 10));
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Shared Workspace & Notes */}
                <Card className="border-border shadow-xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Shared Notes & Learning Resources
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Document key takeaways, repository links, assignments, or questions for your next session.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Next session agenda: Build a JWT authentication flow; Homework: Read Supabase RLS documentation..."
                      rows={5}
                      className="text-xs font-mono"
                    />

                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Shared in persistent database for this exchange.</span>
                      <Button
                        size="sm"
                        onClick={handleSaveProgress}
                        disabled={saving}
                        className="text-xs font-semibold bg-primary text-primary-foreground gap-1.5"
                      >
                        <Save className="h-3.5 w-3.5" /> Save All Progress
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="p-8 text-center text-muted-foreground text-sm">
                Select an active exchange on the left to view and edit its learning progress.
              </Card>
            )}
          </div>
        </div>
      )}

      {/* LOG SESSION HOURS MODAL */}
      <Dialog open={logModalOpen} onOpenChange={setLogModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Log Completed Practice Hours
            </DialogTitle>
            <DialogDescription>
              Record time invested into this peer skill exchange.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSessionLog} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs">Session Date</Label>
              <Input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Duration (in hours)</Label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                value={logHours}
                onChange={(e) => setLogHours(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Summary of Topics Covered</Label>
              <Textarea
                value={logSummary}
                onChange={(e) => setLogSummary(e.target.value)}
                placeholder="e.g. Practiced debugging backend edge functions, covered REST endpoints..."
                rows={3}
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setLogModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-semibold">
                Record Entry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
