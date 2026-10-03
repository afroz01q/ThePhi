import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Users,
  UserCheck,
  UserPlus,
  Clock,
  MessageSquare,
  ArrowLeftRight,
  Shield,
  Sparkles,
  Trash2,
  Check,
  X,
  Search,
  ExternalLink,
} from 'lucide-react';
import {
  fetchUserConnections,
  respondToConnection,
  removeConnection,
} from '@/api/skillxchange';
import type { Connection } from '@/types/types';
import { toast } from 'sonner';

export function ConnectionsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'connected';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadConnections = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchUserConnections(user.id);
      setConnections(data);
    } catch (err: any) {
      console.error(err);
      toast.error('Could not load connections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, [user]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['connected', 'received', 'sent'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleRespond = async (connectionId: string, status: 'connected' | 'declined') => {
    try {
      await respondToConnection(connectionId, status);
      toast.success(status === 'connected' ? 'Connection accepted! You can now message directly.' : 'Connection request declined.');
      loadConnections();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update connection');
    }
  };

  const handleRemove = async (connectionId: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) return;
    try {
      await removeConnection(connectionId);
      toast.success('Connection removed');
      loadConnections();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove connection');
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <Users className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-xl font-bold">Please sign in to view your peer connections</h2>
        <Link to="/login"><Button>Sign In</Button></Link>
      </div>
    );
  }

  const connectedList = connections.filter(c => c.status === 'connected');
  const receivedList = connections.filter(c => c.status === 'pending' && c.recipient_id === user.id);
  const sentList = connections.filter(c => c.status === 'pending' && c.requester_id === user.id);

  // Search filtering in connected
  const filteredConnected = connectedList.filter(c => {
    const peer = c.requester_id === user.id ? c.recipient : c.requester;
    const name = peer?.full_name || peer?.username || '';
    const bio = peer?.bio || '';
    const term = searchTerm.toLowerCase();
    return name.toLowerCase().includes(term) || bio.toLowerCase().includes(term);
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border/80">
        <div className="space-y-1">
          <span className="ed-meta">Peer Network // Verified Relations</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            My Connections
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-sans">
            Build your private network of trusted mentors, collaborative learners, and skill-exchange partners.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/explore">
            <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 font-semibold text-xs uppercase tracking-wider gap-1.5 shadow-xs">
              <UserPlus className="h-3.5 w-3.5 text-accent" /> Find Peers
            </Button>
          </Link>
          <Link to="/matches">
            <Button size="sm" variant="outline" className="text-xs uppercase tracking-wider gap-1.5 border-border">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Smart Matches
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="ed-card p-5 bg-card border border-border/80 space-y-1">
          <span className="ed-meta flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-accent" /> Active Network
          </span>
          <p className="font-serif text-3xl font-bold text-foreground">{connectedList.length}</p>
          <p className="text-[11px] text-muted-foreground">Mutual peer connections</p>
        </div>

        <div className="ed-card p-5 bg-card border border-border/80 space-y-1">
          <span className="ed-meta flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-accent" /> Pending Requests
          </span>
          <p className="font-serif text-3xl font-bold text-foreground">{receivedList.length}</p>
          <p className="text-[11px] text-muted-foreground">Awaiting your response</p>
        </div>

        <div className="ed-card p-5 bg-card border border-border/80 space-y-1">
          <span className="ed-meta flex items-center gap-1.5">
            <UserPlus className="h-3.5 w-3.5 text-accent" /> Sent Invitations
          </span>
          <p className="font-serif text-3xl font-bold text-foreground">{sentList.length}</p>
          <p className="text-[11px] text-muted-foreground">Pending partner acceptance</p>
        </div>
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="connected" className="text-xs">
            Connected Peers ({connectedList.length})
          </TabsTrigger>
          <TabsTrigger value="received" className="text-xs relative">
            Pending Requests ({receivedList.length})
            {receivedList.length > 0 && (
              <span className="ml-1.5 w-2 h-2 rounded-full bg-primary inline-block" />
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="text-xs">
            Sent Requests ({sentList.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CONNECTED PEERS */}
        <TabsContent value="connected" className="space-y-4">
          {connectedList.length > 0 && (
            <div className="relative max-w-md">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search connected peers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {connectedList.length === 0 ? (
            <Card className="border-dashed border-border py-12 text-center text-muted-foreground space-y-3">
              <Users className="h-10 w-10 text-muted-foreground/60 mx-auto" />
              <p className="font-semibold text-base text-foreground">No peer connections yet</p>
              <p className="text-xs max-w-md mx-auto">
                Connect with members across SkillXChange to coordinate exchanges, share learning roadmaps, and chat directly.
              </p>
              <div className="pt-2">
                <Link to="/explore">
                  <Button size="sm">Browse Member Directory</Button>
                </Link>
              </div>
            </Card>
          ) : filteredConnected.length === 0 ? (
            <Card className="border-dashed border-border py-8 text-center text-muted-foreground">
              <p className="text-sm">No connections match "{searchTerm}"</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredConnected.map((conn) => {
                const peer = conn.requester_id === user.id ? conn.recipient : conn.requester;
                return (
                  <Card key={conn.id} className="border-border shadow-xs hover:border-primary/40 transition-colors">
                    <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                      <div className="flex items-start gap-3.5">
                        <Link to={`/profile/${peer?.id}`}>
                          <img
                            src={peer?.avatar_url || 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_660e9ae4-2f78-4f2b-8de1-1547d1387ee9.jpg'}
                            alt={peer?.full_name || 'Peer'}
                            className="w-12 h-12 rounded-xl object-cover border border-border shrink-0 hover:opacity-90"
                          />
                        </Link>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Link to={`/profile/${peer?.id}`} className="hover:underline">
                              <h3 className="font-bold text-sm text-foreground truncate">
                                {peer?.full_name || peer?.username || 'Peer'}
                              </h3>
                            </Link>
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              Connected
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {peer?.bio || 'SkillXChange active practitioner.'}
                          </p>
                          <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                            <span>Trust: {peer?.reputation_score ?? 50}/100</span>
                            <span>•</span>
                            <span>{peer?.location || 'Global'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border/60 gap-2">
                        <div className="flex items-center gap-2">
                          <Link to="/chat">
                            <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 border-border">
                              <MessageSquare className="h-3.5 w-3.5" /> Chat
                            </Button>
                          </Link>
                          <Link to={`/profile/${peer?.id}`}>
                            <Button size="sm" className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground">
                              <ArrowLeftRight className="h-3.5 w-3.5" /> Exchange
                            </Button>
                          </Link>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemove(conn.id)}
                          title="Disconnect"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: PENDING RECEIVED */}
        <TabsContent value="received" className="space-y-4">
          {receivedList.length === 0 ? (
            <Card className="border-dashed border-border py-12 text-center text-muted-foreground space-y-2">
              <Check className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="font-semibold text-base text-foreground">You're all caught up!</p>
              <p className="text-xs max-w-md mx-auto">No pending incoming connection requests right now.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {receivedList.map((conn) => (
                <Card key={conn.id} className="border-border shadow-xs">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Link to={`/profile/${conn.requester?.id}`}>
                        <img
                          src={conn.requester?.avatar_url || 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_660e9ae4-2f78-4f2b-8de1-1547d1387ee9.jpg'}
                          alt={conn.requester?.full_name || 'Requester'}
                          className="w-11 h-11 rounded-xl object-cover border border-border shrink-0 mt-0.5"
                        />
                      </Link>
                      <div className="space-y-1">
                        <Link to={`/profile/${conn.requester?.id}`} className="hover:underline">
                          <h4 className="font-bold text-sm text-foreground">
                            {conn.requester?.full_name || conn.requester?.username}
                          </h4>
                        </Link>
                        <p className="text-xs text-muted-foreground line-clamp-1">{conn.requester?.bio}</p>
                        {conn.note && (
                          <p className="text-xs bg-muted/60 p-2 rounded-md border border-border/80 text-foreground italic">
                            "{conn.note}"
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          Requested {new Date(conn.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleRespond(conn.id, 'declined')}
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Decline
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs h-8 bg-primary text-primary-foreground font-semibold"
                        onClick={() => handleRespond(conn.id, 'connected')}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Accept Connection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 3: PENDING SENT */}
        <TabsContent value="sent" className="space-y-4">
          {sentList.length === 0 ? (
            <Card className="border-dashed border-border py-12 text-center text-muted-foreground space-y-2">
              <UserPlus className="h-8 w-8 text-muted-foreground/60 mx-auto" />
              <p className="font-semibold text-base text-foreground">No outgoing connection requests</p>
              <p className="text-xs max-w-md mx-auto">
                Explore member profiles to send connection invitations.
              </p>
              <div className="pt-2">
                <Link to="/explore">
                  <Button size="sm" variant="outline">Explore Members</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {sentList.map((conn) => (
                <Card key={conn.id} className="border-border shadow-xs">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Link to={`/profile/${conn.recipient?.id}`}>
                        <img
                          src={conn.recipient?.avatar_url || 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_660e9ae4-2f78-4f2b-8de1-1547d1387ee9.jpg'}
                          alt={conn.recipient?.full_name || 'Recipient'}
                          className="w-10 h-10 rounded-xl object-cover border border-border shrink-0"
                        />
                      </Link>
                      <div className="space-y-0.5">
                        <Link to={`/profile/${conn.recipient?.id}`} className="hover:underline">
                          <h4 className="font-bold text-sm text-foreground">
                            {conn.recipient?.full_name || conn.recipient?.username}
                          </h4>
                        </Link>
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          Invitation Sent • Pending Acceptance
                        </Badge>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(conn.id)}
                    >
                      Cancel Request
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
