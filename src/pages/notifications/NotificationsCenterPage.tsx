import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Bell,
  CheckCircle2,
  Calendar,
  Repeat,
  Star,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Inbox,
  XCircle,
} from 'lucide-react';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/api/skillxchange';
import type { NotificationItem } from '@/types/types';
import { toast } from 'sonner';

export function NotificationsCenterPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all');

  const loadNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await fetchNotifications(user.id);
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark read');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'exchange_request':
        return <Repeat className="h-4 w-4 text-primary" />;
      case 'request_accepted':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'request_declined':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-sky-500" />;
      case 'session_scheduled':
        return <Calendar className="h-4 w-4 text-amber-500" />;
      case 'session_cancelled':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'session_completed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'review':
        return <Star className="h-4 w-4 text-amber-500 fill-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <Bell className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-xl font-bold">Please sign in to view notifications</h2>
        <Link to="/login"><Button>Sign In</Button></Link>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const exchangesList = notifications.filter(
    (n) => n.type === 'exchange_request' || n.type === 'request_accepted' || n.type === 'request_declined'
  );
  const messagesList = notifications.filter((n) => n.type === 'message');
  const sessionsList = notifications.filter(
    (n) => n.type === 'session_scheduled' || n.type === 'session_cancelled' || n.type === 'session_completed'
  );
  const unreadList = notifications.filter((n) => !n.is_read);

  const displayedNotifications =
    filterTab === 'exchanges'
      ? exchangesList
      : filterTab === 'messages'
      ? messagesList
      : filterTab === 'sessions'
      ? sessionsList
      : filterTab === 'unread'
      ? unreadList
      : notifications;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <span className="ed-meta">Dispatches & Alerts</span>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground font-mono text-[10px] ml-2 uppercase">
                {unreadCount} Unread
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time automated alerts for skill proposals, direct messages, and upcoming peer sessions.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="text-xs uppercase tracking-wider border-border shrink-0">
            Mark All as Read
          </Button>
        )}
      </div>

      <Tabs value={filterTab} onValueChange={setFilterTab} className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="all" className="text-xs">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="exchanges" className="text-xs">
            Exchanges ({exchangesList.length})
          </TabsTrigger>
          <TabsTrigger value="messages" className="text-xs">
            Messages ({messagesList.length})
          </TabsTrigger>
          <TabsTrigger value="sessions" className="text-xs">
            Sessions ({sessionsList.length})
          </TabsTrigger>
          <TabsTrigger value="unread" className="text-xs">
            Unread ({unreadList.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filterTab} className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : displayedNotifications.length === 0 ? (
            <Card className="border-dashed border-border py-12 text-center text-muted-foreground space-y-2">
              <Inbox className="h-8 w-8 mx-auto text-muted-foreground/60" />
              <p className="font-semibold text-base text-foreground">No alerts in this category</p>
              <p className="text-xs">
                {filterTab === 'unread'
                  ? "You are all caught up! There are no unread notifications."
                  : "Activity corresponding to this filter will appear here automatically."}
              </p>
            </Card>
          ) : (
            displayedNotifications.map((item) => (
              <Card
                key={item.id}
                className={`border-border transition-colors ${
                  !item.is_read ? 'bg-primary/5 border-primary/30' : 'bg-card'
                }`}
              >
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      {getIcon(item.type)}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-foreground">{item.title}</p>
                        {!item.is_read && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed break-words">
                        {item.content}
                      </p>
                      <p className="text-[10px] text-muted-foreground/80 font-mono">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-center">
                    {item.link && (
                      <Link to={item.link} onClick={() => handleMarkRead(item.id)}>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-primary gap-1 font-semibold">
                          View <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                    {!item.is_read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => handleMarkRead(item.id)}
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
