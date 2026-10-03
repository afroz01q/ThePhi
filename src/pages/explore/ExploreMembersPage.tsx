import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Search,
  Filter,
  Sparkles,
  ArrowLeftRight,
  Star,
  MapPin,
  Globe,
  Clock,
  Shield,
  Send,
  X,
  Compass,
  UserPlus,
} from 'lucide-react';
import {
  fetchCategories,
  fetchSkills,
  searchMembers,
  fetchMemberDetails,
  createExchangeRequest,
  sendConnectionRequest,
  fetchCourses,
  addUserLearningSkill,
} from '@/api/skillxchange';
import type { SkillCategory, Skill, Profile, UserTeachingSkill, UserLearningSkill, Course } from '@/types/types';
import { BookOpen, Users } from 'lucide-react';
import { toast } from 'sonner';

export function ExploreMembersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exploreTab, setExploreTab] = useState<'members' | 'courses'>('members');
  const [members, setMembers] = useState<Profile[]>([]);
  const [memberDetailsMap, setMemberDetailsMap] = useState<Record<string, { teaching: UserTeachingSkill[]; learning: UserLearningSkill[] }>>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || 'all');
  const [selectedSkill, setSelectedSkill] = useState(searchParams.get('skillId') || 'all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [minRating, setMinRating] = useState('0');

  // Proposal Modal
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [targetMember, setTargetMember] = useState<Profile | null>(null);
  const [myTeachingSkills, setMyTeachingSkills] = useState<UserTeachingSkill[]>([]);
  const [mySelectedTeachId, setMySelectedTeachId] = useState('');
  const [targetSelectedLearnId, setTargetSelectedLearnId] = useState('');
  const [proposalMsg, setProposalMsg] = useState('');
  const [proposalFormat, setProposalFormat] = useState('Online');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchCategories().catch(() => []),
      fetchSkills().catch(() => []),
      fetchCourses().catch(() => []),
    ]).then(([cats, sks, co]) => {
      setCategories(cats);
      setSkills(sks);
      setCourses(co);
    });

    if (user) {
      fetchMemberDetails(user.id).then((res) => {
        if (res) {
          setMyTeachingSkills(res.teachingSkills);
          if (res.teachingSkills.length > 0) {
            setMySelectedTeachId(res.teachingSkills[0].skill_id);
          }
        }
      });
    }
  }, [user]);

  const runSearch = async () => {
    setLoading(true);
    try {
      const results = await searchMembers({
        query: searchQuery,
        language: selectedLanguage,
        minRating: parseFloat(minRating) || 0,
      });

      // Filter out self
      const otherMembers = results.filter((p) => p.id !== user?.id);
      setMembers(otherMembers);

      // Load skills for each member
      const map: Record<string, { teaching: UserTeachingSkill[]; learning: UserLearningSkill[] }> = {};
      await Promise.all(
        otherMembers.map(async (m) => {
          const det = await fetchMemberDetails(m.id);
          if (det) {
            map[m.id] = {
              teaching: det.teachingSkills,
              learning: det.learningSkills,
            };
          }
        })
      );
      setMemberDetailsMap(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSearch();
  }, [searchQuery, selectedCategory, selectedSkill, selectedLanguage, minRating]);

  const handleOpenProposal = (member: Profile) => {
    if (!user) {
      toast.error('Please sign in or register to propose a skill exchange');
      navigate('/login');
      return;
    }
    setTargetMember(member);
    const targetSkills = memberDetailsMap[member.id]?.teaching || [];
    if (targetSkills.length > 0) {
      setTargetSelectedLearnId(targetSkills[0].skill_id);
    } else if (skills.length > 0) {
      setTargetSelectedLearnId(skills[0].id);
    }

    if (myTeachingSkills.length > 0) {
      setMySelectedTeachId(myTeachingSkills[0].skill_id);
    } else if (skills.length > 1) {
      setMySelectedTeachId(skills[1].id);
    } else if (skills.length > 0) {
      setMySelectedTeachId(skills[0].id);
    }

    setProposalMsg(`Hi ${member.full_name || member.username}, I would love to learn from your experience and offer my skills in return!`);
    setProposalModalOpen(true);
  };

  const handleQuickConnect = async (member: Profile) => {
    if (!user) {
      toast.error('Please sign in to connect with peers');
      navigate('/login');
      return;
    }
    try {
      await sendConnectionRequest(member.id);
      toast.success(`Connection request sent to ${member.full_name || member.username}!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send connection request');
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMember) return;
    if (!mySelectedTeachId || !targetSelectedLearnId) {
      toast.error('Please select both a skill you will teach and a skill you want to learn');
      return;
    }
    if (!proposalMsg.trim()) {
      toast.error('Please write a proposal message');
      return;
    }

    setSubmitting(true);
    try {
      await createExchangeRequest({
        receiver_id: targetMember.id,
        teach_skill_id: mySelectedTeachId,
        learn_skill_id: targetSelectedLearnId,
        proposal_message: proposalMsg.trim(),
        preferred_format: proposalFormat,
      });
      toast.success('Skill exchange proposal sent successfully!');
      setProposalModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSkill('all');
    setSelectedLanguage('all');
    setMinRating('0');
  };

  const handleEnrollCourse = async (course: Course) => {
    if (!user) {
      toast.error('Please sign in or register to add learning interests');
      navigate('/login');
      return;
    }
    try {
      const primarySkillId = course.primary_skill_id || skills[0]?.id;
      if (!primarySkillId) {
        toast.error('No linked skill found for this course.');
        return;
      }
      await addUserLearningSkill({
        skill_id: primarySkillId,
        course_id: course.id,
        current_level: 'Beginner',
        target_level: course.level || 'Intermediate',
        priority: 'High',
        notes: `Enrolled interest in course: ${course.title}`,
        preferred_format: 'Online',
      });
      toast.success(`Enrolled interest in "${course.title}"! Added to your learning profile.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add learning interest');
    }
  };

  const filteredCourses = courses.filter((c) => {
    return (
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <span className="ed-meta">Community Directory & Catalog</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-1">
            Explore Peer Members & Courses
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-sans">
            Discover community members by the skills they teach, the skills they want to learn, and curated learning courses.
          </p>
        </div>

        <Link to="/matches">
          <Button variant="outline" className="gap-2 text-xs font-semibold uppercase tracking-wider shrink-0 border-border">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Smart Match Engine
          </Button>
        </Link>
      </div>

      {/* Directory & Catalog Tabs */}
      <div className="flex items-center gap-6 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => setExploreTab('members')}
          className={`pb-2.5 text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
            exploreTab === 'members'
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Peer Members ({members.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setExploreTab('courses')}
          className={`pb-2.5 text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
            exploreTab === 'courses'
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="h-4 w-4 text-accent" />
          <span>Curated Courses ({courses.length})</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="border-border shadow-xs bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={exploreTab === 'members' ? "Search member name, skill keyword, bio, or location..." : "Search course title, skill, or topic..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm h-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {exploreTab === 'members' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="Mandarin">Mandarin</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Min Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any Rating</SelectItem>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                    <SelectItem value="4.8">4.8+ Stars</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-10">
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {exploreTab === 'courses' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Showing {filteredCourses.length} learning courses</span>
            <span>Real database courses available for community skill exchange</span>
          </div>

          {filteredCourses.length === 0 ? (
            <Card className="border-dashed border-border py-12 text-center text-muted-foreground space-y-3">
              <p className="text-base font-semibold">No courses found matching your query</p>
              <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>Clear Search</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="border-border shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between">
                  <CardContent className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono border-accent text-accent">
                          {course.category}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          {course.level}
                        </Badge>
                      </div>

                      <h3 className="font-serif font-bold text-lg text-foreground leading-snug">
                        {course.title}
                      </h3>

                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {course.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                        {course.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-primary" /> {course.duration}
                          </span>
                        )}
                        {course.instructor && (
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-primary" /> By {course.instructor}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/70 flex items-center justify-between gap-2 mt-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs flex-1"
                        onClick={() => {
                          setSearchQuery(course.primary_skill?.name || course.title.split(' ')[0]);
                          setExploreTab('members');
                        }}
                      >
                        Find Teachers
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs bg-primary text-primary-foreground font-semibold flex-1 gap-1"
                        onClick={() => handleEnrollCourse(course)}
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>I Want to Learn</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Results Count */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Showing {members.length} peer members</span>
            <span>Green = Teaches • Amber = Wants to Learn</span>
          </div>

          {/* Members Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <Card className="border-dashed border-border py-12 text-center text-muted-foreground space-y-3">
          <p className="text-base font-semibold">No members found matching your search</p>
          <p className="text-xs">Try clearing some filters or searching for broader terms like "design" or "python".</p>
          <Button variant="outline" size="sm" onClick={clearFilters}>Reset Search</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {members.map((member) => {
            const memberSkills = memberDetailsMap[member.id] || { teaching: [], learning: [] };
            return (
              <Card key={member.id} className="border-border hover:border-primary/40 transition-colors shadow-xs flex flex-col justify-between">
                <CardContent className="p-5 space-y-4">
                  {/* Member Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar_url || 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_660e9ae4-2f78-4f2b-8de1-1547d1387ee9.jpg'}
                        alt={member.full_name || 'Member'}
                        className="w-12 h-12 rounded-full object-cover border border-border shadow-xs"
                      />
                      <div>
                        <Link to={`/profile/${member.id}`} className="hover:underline">
                          <h3 className="font-bold text-base text-foreground">
                            {member.full_name || member.username}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          {member.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {member.location}
                            </span>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1 text-amber-500 font-semibold">
                            <Star className="h-3 w-3 fill-amber-500" /> {member.average_rating || 5.0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge variant="outline" className="text-xs font-semibold border-primary/30 text-primary">
                        <Shield className="h-3 w-3 mr-1 text-primary" />
                        Score: {member.reputation_score || 50}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {member.completed_sessions || 0} sessions done
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  {member.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {member.bio}
                    </p>
                  )}

                  {/* Dual-Pill Badges: Teach vs Learn */}
                  <div className="space-y-2 pt-1 border-t border-border/60">
                    {/* Can Teach */}
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider w-16 shrink-0 pt-0.5">
                        Teaches:
                      </span>
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {memberSkills.teaching.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">No skills listed yet</span>
                        ) : (
                          memberSkills.teaching.map((ts) => (
                            <Badge
                              key={ts.id}
                              variant="secondary"
                              className="text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                            >
                              {ts.skill?.name || 'Skill'} ({ts.proficiency_level})
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Wants to Learn */}
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider w-16 shrink-0 pt-0.5">
                        Learns:
                      </span>
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {memberSkills.learning.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">Open to ideas</span>
                        ) : (
                          memberSkills.learning.map((ls) => (
                            <Badge
                              key={ls.id}
                              variant="secondary"
                              className="text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                            >
                              {ls.skill?.name || 'Skill'} ({ls.target_level})
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Link to={`/profile/${member.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 text-xs">
                          View Profile
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1 border-border"
                        onClick={() => handleQuickConnect(member)}
                      >
                        <UserPlus className="h-3 w-3 text-primary" />
                        Connect
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      className="h-8 text-xs bg-primary text-primary-foreground font-semibold gap-1.5 shadow-xs"
                      onClick={() => handleOpenProposal(member)}
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                      Propose Exchange
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* PROPOSAL MODAL */}
      <Dialog open={proposalModalOpen} onOpenChange={setProposalModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              Propose Skill Exchange
            </DialogTitle>
            <DialogDescription>
              Collaborate directly with {targetMember?.full_name || targetMember?.username}. You both share knowledge without money.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitProposal} className="space-y-4 pt-2">
            {/* Target Skill to Learn */}
            <div className="space-y-2">
              <Label>Skill You Want to Learn from {targetMember?.full_name?.split(' ')[0] || 'Peer'} *</Label>
              <Select value={targetSelectedLearnId} onValueChange={setTargetSelectedLearnId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select their skill..." />
                </SelectTrigger>
                <SelectContent>
                  {(targetMember ? memberDetailsMap[targetMember.id]?.teaching || [] : []).length > 0 ? (
                    (memberDetailsMap[targetMember!.id]?.teaching || []).map((ts) => (
                      <SelectItem key={ts.skill_id} value={ts.skill_id}>
                        {ts.skill?.name || 'Skill'} ({ts.proficiency_level} • {ts.experience_years} yrs exp)
                      </SelectItem>
                    ))
                  ) : (
                    skills.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.category?.name || 'General'})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* My Skill to Teach */}
            <div className="space-y-2">
              <Label>Skill You Will Teach in Return *</Label>
              <Select value={mySelectedTeachId} onValueChange={setMySelectedTeachId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a skill you can teach..." />
                </SelectTrigger>
                <SelectContent>
                  {myTeachingSkills.length > 0 ? (
                    myTeachingSkills.map((ts) => (
                      <SelectItem key={ts.skill_id} value={ts.skill_id}>
                        {ts.skill?.name || 'Skill'} ({ts.proficiency_level})
                      </SelectItem>
                    ))
                  ) : (
                    skills.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.category?.name || 'General'})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {myTeachingSkills.length === 0 && (
                <p className="text-[11px] text-muted-foreground">Showing full catalog since you haven't listed teaching skills on your profile yet.</p>
              )}
            </div>

            {/* Format */}
            <div className="space-y-2">
              <Label>Preferred Format</Label>
              <Select value={proposalFormat} onValueChange={setProposalFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Online">Online Video / Screen Share</SelectItem>
                  <SelectItem value="In-Person">In-Person Meeting</SelectItem>
                  <SelectItem value="Both">Flexible (Either)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Proposal Message */}
            <div className="space-y-2">
              <Label>Introduction & Proposal Note *</Label>
              <Textarea
                value={proposalMsg}
                onChange={(e) => setProposalMsg(e.target.value)}
                rows={3}
                placeholder="Mention your background, what you hope to learn, and when you are free..."
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setProposalModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !mySelectedTeachId || !targetSelectedLearnId} className="bg-primary text-primary-foreground font-semibold">
                {submitting ? 'Sending Proposal...' : 'Send Proposal'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
