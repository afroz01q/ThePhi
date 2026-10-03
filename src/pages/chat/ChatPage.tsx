import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  MessageSquare,
  Send,
  Calendar,
  Sparkles,
  User,
  Shield,
  TrendingUp,
  Search,
  ShieldAlert,
  Flag,
} from 'lucide-react';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
} from '@/api/skillxchange';
import type { Conversation, Message } from '@/types/types';
import { LearningProgressTracker } from '@/components/chat/LearningProgressTracker';
import { ReportModal } from '@/components/common/ReportModal';
import { toast } from 'sonner';

export function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reporting State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTargetType, setReportTargetType] = useState<'user' | 'message'>('user');
  const [reportTargetId, setReportTargetId] = useState<string | undefined>(undefined);
  const [reportSnippet, setReportSnippet] = useState<string | undefined>(undefined);

  const loadConversations = async () => {
    if (!user) return;
    try {
      const list = await fetchConversations(user.id);
      setConversations(list);
      if (list.length > 0 && !activeConv) {
        setActiveConv(list[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user]);

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (!activeConv) return;
    fetchMessages(activeConv.id).then((msgs) => {
      setMessages(msgs);
      scrollToBottom();
    });

    // Poll for new messages every 3 seconds for active conversation
    const interval = setInterval(() => {
      fetchMessages(activeConv.id).then(setMessages);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeConv?.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !inputMsg.trim()) return;

    setSending(true);
    try {
      const newMsg = await sendMessage(activeConv.id, inputMsg.trim());
      setMessages((prev) => [...prev, newMsg]);
      setInputMsg('');
      scrollToBottom();
      loadConversations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const name = c.other_participant?.full_name || c.other_participant?.username || '';
    return name.toLowerCase().includes(searchFilter.toLowerCase());
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <MessageSquare className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-xl font-bold">Sign In to Access Real-Time Chat</h2>
        <Link to="/login"><Button>Sign In</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="h-[calc(100vh-10rem)] border border-border rounded-2xl bg-card shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* LEFT CONVERSATION LIST (4 cols) */}
        <div className="md:col-span-4 border-r border-border flex flex-col h-full bg-muted/10">
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="ed-meta">Correspondence</span>
                <h2 className="font-serif font-bold text-base text-foreground mt-0.5">
                  Dialogue Inbox
                </h2>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-border">
                {conversations.length} Active
              </Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search peers..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 text-xs h-8 bg-card border-border/80"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No active conversations yet. Conversations automatically start once an exchange proposal is accepted!
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = activeConv?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveConv(c)}
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors ${
                      isSelected ? 'bg-muted/60 border-l-2 border-accent' : 'hover:bg-muted/40'
                    }`}
                  >
                    <img
                      src={c.other_participant?.avatar_url || 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_660e9ae4-2f78-4f2b-8de1-1547d1387ee9.jpg'}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover shrink-0 mt-0.5 border border-border"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-xs text-foreground truncate">
                          {c.other_participant?.full_name || c.other_participant?.username}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {c.last_message_text || 'Start conversation...'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT ACTIVE CHAT WINDOW (8 cols) */}
        {activeConv ? (
          <div className="md:col-span-8 flex flex-col h-full bg-card">
            {/* Chat Header */}
            <div className="p-3.5 px-5 border-b border-border flex items-center justify-between gap-4 bg-muted/20">
              <div className="flex items-center gap-3">
                <img
                  src={activeConv.other_participant?.avatar_url || 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_660e9ae4-2f78-4f2b-8de1-1547d1387ee9.jpg'}
                  alt="Partner"
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <Link to={`/profile/${activeConv.other_participant?.id}`} className="hover:underline">
                    <h3 className="font-bold text-sm text-foreground">
                      {activeConv.other_participant?.full_name || activeConv.other_participant?.username}
                    </h3>
                  </Link>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <span>{activeConv.other_participant?.location || 'Global'}</span>
                    <span>•</span>
                    <span className="text-primary font-medium">Reputation: {activeConv.other_participant?.reputation_score || 50}/100</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link to="/sessions">
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Book Session
                  </Button>
                </Link>

                {/* Report User action */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1 px-2"
                  onClick={() => {
                    setReportTargetType('user');
                    setReportTargetId(activeConv.other_participant?.id);
                    setReportSnippet(undefined);
                    setReportModalOpen(true);
                  }}
                  title="Report user"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Report</span>
                </Button>

                {/* Drawer for Learning Progress */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button size="sm" variant="secondary" className="h-8 text-xs gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      Goals
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[340px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle className="text-base">Exchange Learning Goals</SheetTitle>
                    </SheetHeader>
                    <div className="py-4">
                      <LearningProgressTracker exchangeId={activeConv.exchange_id} />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/5">
              {messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">Say hello to start trading skills!</p>
                  <p>Exchange scheduling ideas, clarify topics, or share resources.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.sender_id === user.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex items-end gap-2 group ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMine && (
                        <img
                          src={m.sender?.avatar_url || 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_660e9ae4-2f78-4f2b-8de1-1547d1387ee9.jpg'}
                          alt="Avatar"
                          className="w-6 h-6 rounded-full object-cover shrink-0 mb-1"
                        />
                      )}
                      
                      {!isMine && (
                        <button
                          type="button"
                          onClick={() => {
                            setReportTargetType('message');
                            setReportTargetId(m.id);
                            setReportSnippet(m.message_text);
                            setReportModalOpen(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive"
                          title="Report inappropriate message"
                        >
                          <Flag className="h-3 w-3" />
                        </button>
                      )}

                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 text-xs leading-relaxed shadow-xs ${
                          isMine
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-card border border-border text-foreground rounded-bl-none'
                        }`}
                      >
                        <p>{m.message_text}</p>
                        <span
                          className={`text-[9px] block text-right mt-1 opacity-70 ${
                            isMine ? 'text-primary-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSend} className="p-3 border-t border-border flex items-center gap-2 bg-card">
              <Input
                placeholder="Type a message (e.g. 'Are you free for Python on Thursday?')..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                disabled={sending}
                className="text-xs h-10"
              />
              <Button type="submit" disabled={sending || !inputMsg.trim()} size="icon" className="h-10 w-10 shrink-0 bg-primary text-primary-foreground">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        ) : (
          <div className="md:col-span-8 flex items-center justify-center p-8 text-center text-muted-foreground text-sm">
            Select a conversation to start chatting.
          </div>
        )}
      </div>

      {/* REPORT MODAL */}
      <ReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        targetType={reportTargetType}
        targetId={reportTargetId}
        reportedUserId={activeConv?.other_participant?.id}
        reportedUserName={activeConv?.other_participant?.full_name || activeConv?.other_participant?.username || undefined}
        contentSnippet={reportSnippet}
      />
    </div>
  );
}
