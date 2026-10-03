import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Plus, CheckCircle2, Target, Award } from 'lucide-react';
import { fetchLearningProgress, saveLearningProgress } from '@/api/skillxchange';
import type { LearningProgress } from '@/types/types';
import { toast } from 'sonner';

interface Props {
  exchangeId: string;
}

export function LearningProgressTracker({ exchangeId }: Props) {
  const [progressList, setProgressList] = useState<LearningProgress[]>([]);
  const [loading, setLoading] = useState(true);

  // New goal modal
  const [openModal, setOpenModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [startLevel, setStartLevel] = useState('Beginner');
  const [targetLevel, setTargetLevel] = useState('Advanced');
  const [milestone1, setMilestone1] = useState('Learn core syntax and environment');
  const [milestone2, setMilestone2] = useState('Build a functional project');
  const [milestone3, setMilestone3] = useState('Code review with mentor');

  const loadProgress = async () => {
    try {
      setLoading(true);
      const data = await fetchLearningProgress(exchangeId);
      setProgressList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (exchangeId) {
      loadProgress();
    }
  }, [exchangeId]);

  const handleToggleMilestone = async (p: LearningProgress, index: number) => {
    const updated = [...p.milestones];
    updated[index].completed = !updated[index].completed;

    const completedCount = updated.filter((m) => m.completed).length;
    const newPercent = Math.round((completedCount / updated.length) * 100);

    try {
      await saveLearningProgress({
        exchange_id: exchangeId,
        goal_title: p.goal_title,
        starting_level: p.starting_level,
        current_level: newPercent >= 70 ? p.target_level : p.current_level,
        target_level: p.target_level,
        progress_percent: newPercent,
        milestones: updated,
      });
      loadProgress();
      toast.success('Learning milestone updated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update milestone');
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    try {
      const milestones = [
        { title: milestone1.trim(), completed: false },
        { title: milestone2.trim(), completed: false },
        { title: milestone3.trim(), completed: false },
      ].filter((m) => m.title);

      await saveLearningProgress({
        exchange_id: exchangeId,
        goal_title: goalTitle.trim(),
        starting_level: startLevel,
        current_level: startLevel,
        target_level: targetLevel,
        progress_percent: 0,
        milestones,
      });

      toast.success('Learning goal created!');
      setOpenModal(false);
      setGoalTitle('');
      loadProgress();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create goal');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Learning Progress Tracker
        </h3>

        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" /> New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
            <DialogHeader>
              <DialogTitle>Define Exchange Learning Goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateGoal} className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs">Goal Title</Label>
                <Input
                  placeholder="e.g. Master React hooks & state"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Starting Level</Label>
                  <Select value={startLevel} onValueChange={setStartLevel}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Target Level</Label>
                  <Select value={targetLevel} onValueChange={setTargetLevel}>
                    <SelectTrigger className="h-8 text-xs">
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

              <div className="space-y-2 pt-1">
                <Label className="text-xs font-semibold">Milestones</Label>
                <Input
                  value={milestone1}
                  onChange={(e) => setMilestone1(e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  value={milestone2}
                  onChange={(e) => setMilestone2(e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  value={milestone3}
                  onChange={(e) => setMilestone3(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpenModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
                  Create Goal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {progressList.length === 0 ? (
        <div className="p-4 bg-muted/20 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground space-y-1.5">
          <Target className="h-6 w-6 mx-auto text-muted-foreground/60" />
          <p className="font-medium text-foreground">No learning goals defined yet</p>
          <p>Break your peer exchange into milestones to track mutual growth.</p>
        </div>
      ) : (
        progressList.map((p) => (
          <div key={p.id} className="p-3 bg-muted/40 border border-border rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-foreground">{p.goal_title}</span>
              <span className="text-xs font-bold text-primary">{p.progress_percent}%</span>
            </div>

            <Progress value={p.progress_percent} className="h-1.5" />

            <div className="space-y-1.5 pt-1">
              {p.milestones.map((m, idx) => (
                <label key={idx} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <Checkbox
                    checked={m.completed}
                    onCheckedChange={() => handleToggleMilestone(p, idx)}
                  />
                  <span className={m.completed ? 'line-through text-muted-foreground' : ''}>
                    {m.title}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
