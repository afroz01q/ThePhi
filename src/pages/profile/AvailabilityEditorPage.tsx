import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, Save, ArrowLeft, Calendar, HelpCircle } from 'lucide-react';
import { fetchMemberDetails, saveUserAvailability } from '@/api/skillxchange';
import { toast } from 'sonner';

interface DayConfig {
  day_of_week: number;
  dayName: string;
  enabled: boolean;
  start_time: string;
  end_time: string;
  is_online: boolean;
  is_in_person: boolean;
}

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function AvailabilityEditorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [days, setDays] = useState<DayConfig[]>(
    DAYS.map((name, idx) => ({
      day_of_week: idx,
      dayName: name,
      enabled: idx >= 1 && idx <= 5, // Mon-Fri default
      start_time: '18:00',
      end_time: '20:00',
      is_online: true,
      is_in_person: false,
    }))
  );

  useEffect(() => {
    if (!user) return;
    fetchMemberDetails(user.id)
      .then((res) => {
        if (res && res.availability.length > 0) {
          setDays((prev) =>
            prev.map((d) => {
              const match = res.availability.find((a) => a.day_of_week === d.day_of_week);
              if (match) {
                return {
                  ...d,
                  enabled: true,
                  start_time: match.start_time.slice(0, 5),
                  end_time: match.end_time.slice(0, 5),
                  is_online: match.is_online,
                  is_in_person: match.is_in_person,
                };
              }
              return { ...d, enabled: false };
            })
          );
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const updateDay = (index: number, updates: Partial<DayConfig>) => {
    setDays((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const activeSlots = days
        .filter((d) => d.enabled)
        .map((d) => ({
          day_of_week: d.day_of_week,
          start_time: d.start_time,
          end_time: d.end_time,
          is_online: d.is_online,
          is_in_person: d.is_in_person,
        }));

      await saveUserAvailability(activeSlots);
      toast.success('Weekly availability schedule updated!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <span className="ed-meta">Roster & Operating Hours</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-1">
            Weekly Availability Schedule
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-sans">
            Specify when you are free to teach or learn. The smart matching engine uses these slots to calculate schedule overlap.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-foreground text-background hover:bg-foreground/90 font-semibold text-xs uppercase tracking-wider gap-2 shrink-0 h-9">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Schedule'}
        </Button>
      </div>

      <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl text-xs text-muted-foreground flex items-center gap-3">
        <HelpCircle className="h-5 w-5 text-primary shrink-0" />
        <span>
          Time slots are calculated in your local time zone. When partners check your profile or when smart matching calculates overlap, these recurring hours are matched.
        </span>
      </div>

      <div className="space-y-4">
        {days.map((d, idx) => (
          <Card key={d.day_of_week} className={`border-border transition-colors ${d.enabled ? 'border-primary/40 bg-card' : 'bg-muted/20 opacity-70'}`}>
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-40">
                <Switch
                  checked={d.enabled}
                  onCheckedChange={(checked) => updateDay(idx, { enabled: checked })}
                />
                <span className="font-semibold text-sm text-foreground">{d.dayName}</span>
              </div>

              {d.enabled ? (
                <div className="flex flex-wrap items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input
                      type="time"
                      value={d.start_time}
                      onChange={(e) => updateDay(idx, { start_time: e.target.value })}
                      className="h-8 w-28 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                      type="time"
                      value={d.end_time}
                      onChange={(e) => updateDay(idx, { end_time: e.target.value })}
                      className="h-8 w-28 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-3 pl-2 border-l border-border/80">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <Checkbox
                        checked={d.is_online}
                        onCheckedChange={(c) => updateDay(idx, { is_online: !!c })}
                      />
                      <span>Online</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <Checkbox
                        checked={d.is_in_person}
                        onCheckedChange={(c) => updateDay(idx, { is_in_person: !!c })}
                      />
                      <span>In-Person</span>
                    </label>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">Unavailable on {d.dayName}</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="pt-4 flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground font-semibold gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Schedule'}
        </Button>
      </div>
    </div>
  );
}
