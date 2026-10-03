import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { submitReport } from '@/api/skillxchange';
import { toast } from 'sonner';

export interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: 'user' | 'message' | 'post' | 'comment';
  targetId?: string;
  reportedUserId?: string;
  reportedUserName?: string;
  contentSnippet?: string;
}

const REPORT_REASONS = [
  { value: 'Harassment or Hate Speech', label: 'Harassment or Hate Speech' },
  { value: 'Inappropriate Content or Nudity', label: 'Inappropriate Content or Nudity' },
  { value: 'Spam or Commercial Solicitation', label: 'Spam or Commercial Solicitation' },
  { value: 'Scam, Fraud or Monetary Demands', label: 'Scam, Fraud or Monetary Demands' },
  { value: 'No-Show or Habitual Ghosting', label: 'No-Show or Habitual Ghosting' },
  { value: 'Safety or Privacy Concern', label: 'Safety or Privacy Concern' },
  { value: 'Other Policy Violation', label: 'Other Policy Violation' },
];

export function ReportModal({
  open,
  onOpenChange,
  targetType,
  targetId,
  reportedUserId,
  reportedUserName,
  contentSnippet,
}: ReportModalProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      toast.error('Please choose a reason for the report');
      return;
    }

    setSubmitting(true);
    try {
      await submitReport({
        target_type: targetType,
        target_id: targetId,
        reported_user_id: reportedUserId,
        reason,
        description: description.trim(),
        content_snippet: contentSnippet,
      });

      toast.success('Report submitted. Our moderation team will review this shortly.');
      setDescription('');
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Report Inappropriate {targetType === 'user' ? 'Member' : targetType === 'message' ? 'Message' : 'Content'}
          </DialogTitle>
          <DialogDescription>
            Help keep the SkillXChange community safe, authentic, and respectful.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {reportedUserName && (
            <div className="text-xs bg-muted/60 p-2.5 rounded-md border border-border">
              <span className="text-muted-foreground">Subject of report:</span>{' '}
              <strong className="text-foreground">{reportedUserName}</strong>
            </div>
          )}

          {contentSnippet && (
            <div className="text-xs bg-muted/40 p-2.5 rounded-md border border-border/80 space-y-1">
              <span className="text-muted-foreground font-medium">Flagged Content Preview:</span>
              <p className="italic text-foreground line-clamp-3">"{contentSnippet}"</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Violation Category</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Select violation reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Additional Context (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what occurred, include details or screenshots info..."
              rows={3}
              className="text-xs"
            />
          </div>

          <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-muted-foreground">
            Our admin team reviews flagged items within 24 hours. False or malicious reports violate our Code of Conduct.
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
