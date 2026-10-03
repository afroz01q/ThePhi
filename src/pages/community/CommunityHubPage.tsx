import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  MessageSquare,
  Heart,
  Plus,
  Send,
  Sparkles,
  HelpCircle,
  BookOpen,
  ShieldAlert,
  Flag,
} from 'lucide-react';
import {
  fetchCommunityPosts,
  createCommunityPost,
  fetchCommunityComments,
  addCommunityComment,
  fetchSkills,
} from '@/api/skillxchange';
import type { CommunityPost, CommunityComment, Skill } from '@/types/types';
import { ReportModal } from '@/components/common/ReportModal';
import { toast } from 'sonner';

export function CommunityHubPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Reporting state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTargetType, setReportTargetType] = useState<'post' | 'comment'>('post');
  const [reportTargetId, setReportTargetId] = useState<string | undefined>(undefined);
  const [reportAuthorId, setReportAuthorId] = useState<string | undefined>(undefined);
  const [reportAuthorName, setReportAuthorName] = useState<string | undefined>(undefined);
  const [reportSnippet, setReportSnippet] = useState<string | undefined>(undefined);

  // New post modal
  const [openModal, setOpenModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('Skill Requests');
  const [postSkillId, setPostSkillId] = useState('');
  const [postContent, setPostContent] = useState('');
  const [creating, setCreating] = useState(false);

  // Expanded comments
  const [expandedComments, setExpandedComments] = useState<Record<string, CommunityComment[]>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});

  const loadPosts = async () => {
    try {
      setLoading(true);
      const [postList, skillList] = await Promise.all([
        fetchCommunityPosts(categoryFilter),
        fetchSkills(),
      ]);
      setPosts(postList);
      setSkills(skillList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [categoryFilter]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to publish a community post');
      return;
    }
    if (!postTitle.trim() || !postContent.trim()) {
      toast.error('Please fill in title and content');
      return;
    }

    setCreating(true);
    try {
      await createCommunityPost({
        title: postTitle.trim(),
        content: postContent.trim(),
        category: postCategory,
        skill_id: postSkillId || undefined,
      });
      toast.success('Community discussion posted!');
      setOpenModal(false);
      setPostTitle('');
      setPostContent('');
      loadPosts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  const toggleComments = async (postId: string) => {
    if (expandedComments[postId]) {
      setExpandedComments((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    } else {
      const comments = await fetchCommunityComments(postId);
      setExpandedComments((prev) => ({ ...prev, [postId]: comments }));
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInput[postId];
    if (!text || !text.trim() || !user) return;

    try {
      await addCommunityComment(postId, text.trim());
      toast.success('Comment added!');
      setCommentInput((prev) => ({ ...prev, [postId]: '' }));
      const updated = await fetchCommunityComments(postId);
      setExpandedComments((prev) => ({ ...prev, [postId]: updated }));
      loadPosts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add comment');
    }
  };

  const categories = ['All', 'Skill Requests', 'Learning Tips', 'Project Showcase', 'Introductions'];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <span className="ed-meta">Discourse & Forum</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-1">
            Community Knowledge Hub
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-sans">
            Discuss learning techniques, share peer advice, post skill requests, and connect with other members.
          </p>
        </div>

        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 font-semibold text-xs uppercase tracking-wider gap-1.5 shadow-xs">
              <Plus className="h-4 w-4" /> Start Discussion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <DialogHeader>
              <DialogTitle>Share with the Community</DialogTitle>
              <DialogDescription>
                Ask a question, propose a group exchange idea, or post what skill you are looking to learn.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreatePost} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  placeholder="e.g. Looking for a Spanish conversation partner in exchange for Python basics"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={postCategory} onValueChange={setPostCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Skill Requests">Skill Requests</SelectItem>
                      <SelectItem value="Learning Tips">Learning Tips</SelectItem>
                      <SelectItem value="Project Showcase">Project Showcase</SelectItem>
                      <SelectItem value="Introductions">Introductions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Related Skill (Optional)</Label>
                  <Select value={postSkillId} onValueChange={setPostSkillId}>
                    <SelectTrigger>
                      <SelectValue placeholder="None / General" />
                    </SelectTrigger>
                    <SelectContent>
                      {skills.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Details & Content *</Label>
                <Textarea
                  placeholder="Describe your learning background, what you can offer in return, or what tips helped you..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="bg-primary text-primary-foreground font-semibold">
                  {creating ? 'Posting...' : 'Publish Post'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={categoryFilter === c ? 'default' : 'outline'}
            className="text-xs h-8 shrink-0 rounded-full"
            onClick={() => setCategoryFilter(c)}
          >
            {c}
          </Button>
        ))}
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="border-dashed border-border py-12 text-center text-muted-foreground space-y-2">
          <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/60" />
          <p className="font-semibold text-base">No discussions in this category yet</p>
          <p className="text-xs">Be the first to start a conversation or share a peer tip!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const comments = expandedComments[post.id];
            const isCommentsOpen = !!comments;

            return (
              <Card key={post.id} className="border-border shadow-xs hover:border-primary/30 transition-colors">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.author?.avatar_url || 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_660e9ae4-2f78-4f2b-8de1-1547d1387ee9.jpg'}
                        alt="Author"
                        className="w-10 h-10 rounded-full object-cover border border-border"
                      />
                      <div>
                        <Link to={`/profile/${post.author?.id}`} className="hover:underline">
                          <h4 className="font-bold text-sm text-foreground">
                            {post.author?.full_name || post.author?.username}
                          </h4>
                        </Link>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {post.category}
                      </Badge>
                      {post.skill && (
                        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                          {post.skill.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-foreground">{post.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-1.5 hover:text-foreground font-medium"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{post.comments_count || 0} Comments</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link to={`/profile/${post.author?.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-primary">
                          Connect with {post.author?.full_name?.split(' ')[0] || 'Author'}
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-destructive px-2"
                        onClick={() => {
                          setReportTargetType('post');
                          setReportTargetId(post.id);
                          setReportAuthorId(post.author_id || undefined);
                          setReportAuthorName(post.author?.full_name || post.author?.username || undefined);
                          setReportSnippet(`${post.title} — ${post.content.slice(0, 100)}...`);
                          setReportModalOpen(true);
                        }}
                        title="Report inappropriate post"
                      >
                        <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Report
                      </Button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {isCommentsOpen && (
                    <div className="mt-3 pt-3 border-t border-border/80 space-y-3 bg-muted/20 p-3 rounded-xl">
                      <div className="space-y-2">
                        {comments.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No comments yet. Write the first response!</p>
                        ) : (
                          comments.map((c) => (
                            <div key={c.id} className="p-2.5 bg-card border border-border rounded-lg text-xs space-y-1">
                              <div className="flex items-center justify-between font-semibold">
                                <span>{c.author?.full_name || c.author?.username}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReportTargetType('comment');
                                      setReportTargetId(c.id);
                                      setReportAuthorId(c.author_id || undefined);
                                      setReportAuthorName(c.author?.full_name || c.author?.username || undefined);
                                      setReportSnippet(c.content);
                                      setReportModalOpen(true);
                                    }}
                                    className="text-muted-foreground hover:text-destructive p-0.5"
                                    title="Report comment"
                                  >
                                    <Flag className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-muted-foreground">{c.content}</p>
                            </div>
                          ))
                        )}
                      </div>

                      {user && (
                        <div className="flex items-center gap-2 pt-1">
                          <Input
                            placeholder="Write a helpful reply..."
                            value={commentInput[post.id] || ''}
                            onChange={(e) => setCommentInput((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            className="h-8 text-xs bg-card"
                          />
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-primary text-primary-foreground shrink-0 gap-1"
                            onClick={() => handleAddComment(post.id)}
                          >
                            <Send className="h-3 w-3" /> Reply
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* REPORT MODAL */}
      <ReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        targetType={reportTargetType}
        targetId={reportTargetId}
        reportedUserId={reportAuthorId}
        reportedUserName={reportAuthorName}
        contentSnippet={reportSnippet}
      />
    </div>
  );
}
