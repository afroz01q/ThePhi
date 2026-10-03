import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sparkles,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Star,
  MapPin,
  Shield,
  MessageSquare,
  Repeat,
  Bookmark,
  BookmarkCheck,
  Eye,
  X,
  Undo2,
  GraduationCap,
  BookOpen,
  Filter,
  Search,
  Globe,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import {
  computeSmartMatches,
  createExchangeRequest,
  fetchMemberDetails,
  fetchCategories,
  saveMatch,
  unsaveMatch,
  dismissMatch,
  undismissMatch,
} from '@/api/skillxchange';
import type { MatchResult, UserTeachingSkill, MatchPriority, SkillCategory } from '@/types/types';
import { toast } from 'sonner';

type FeedTab =
  | 'best'
  | 'direct'
  | 'teach_what_you_want'
  | 'want_what_you_teach'
  | 'available'
  | 'nearby'
  | 'online'
  | 'new_matches'
  | 'saved'
  | 'all';

export function SmartMatchesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [allMatches, setAllMatches] = useState<MatchResult[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [activeTab, setActiveTab] = useState<FeedTab>('best');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMatchType, setSelectedMatchType] = useState('all');
  const [selectedOverlapFilter, setSelectedOverlapFilter] = useState('all');
  const [selectedExpertiseFilter, setSelectedExpertiseFilter] = useState('all');
  const [selectedFormatFilter, setSelectedFormatFilter] = useState('all');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState('all');
  const [selectedMinRating, setSelectedMinRating] = useState('0');
  const [sortBy, setSortBy] = useState<'best_match' | 'highest_compatibility' | 'best_availability' | 'best_skills' | 'highest_rating' | 'newest'>('best_match');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [expandedBreakdownId, setExpandedBreakdownId] = useState<string | null>(null);

  // Proposal modal
  const [proposalOpen, setProposalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [myTeachingSkills, setMyTeachingSkills] = useState<UserTeachingSkill[]>([]);
  const [teachSkillId, setTeachSkillId] = useState('');
  const [learnSkillId, setLearnSkillId] = useState('');
  const [proposalMessage, setProposalMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadMatches = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [matchesRes, myDetails, cats] = await Promise.all([
        computeSmartMatches(user.id),
        fetchMemberDetails(user.id),
        fetchCategories().catch(() => []),
      ]);
      setAllMatches(matchesRes);
      setCategories(cats);
      if (myDetails) {
        setMyTeachingSkills(myDetails.teachingSkills);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to compute smart matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [user]);

  const handleOpenProposal = (match: MatchResult) => {
    setSelectedMatch(match);
    if (match.skillsYouTeachTheyWant.length > 0) {
      setTeachSkillId(match.skillsYouTeachTheyWant[0].id);
    } else if (myTeachingSkills.length > 0) {
      setTeachSkillId(myTeachingSkills[0].skill_id);
    }

    if (match.skillsTheyTeachYouWant.length > 0) {
      setLearnSkillId(match.skillsTheyTeachYouWant[0].id);
    }

    setProposalMessage(
      `Hi ${match.member.full_name || match.member.username}! The matching engine showed our complementary skills. I would love to propose an exchange!`
    );
    setProposalOpen(true);
  };

  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    if (!teachSkillId || !learnSkillId) {
      toast.error('Please select both skills for the exchange');
      return;
    }

    setSubmitting(true);
    try {
      await createExchangeRequest({
        receiver_id: selectedMatch.member.id,
        teach_skill_id: teachSkillId,
        learn_skill_id: learnSkillId,
        proposal_message: proposalMessage.trim(),
        preferred_format: selectedMatch.member.preferred_format || 'Online',
      });
      toast.success('Exchange proposal sent successfully!');
      setProposalOpen(false);
      // Update match card state
      setAllMatches(prev =>
        prev.map(m =>
          m.member.id === selectedMatch.member.id
            ? { ...m, hasActiveRequest: true, activeRequestStatus: 'pending' }
            : m
        )
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to send proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSave = async (match: MatchResult) => {
    const isCurrentlySaved = match.isSaved;
    try {
      if (isCurrentlySaved) {
        await unsaveMatch(match.member.id);
        toast.info('Removed from saved matches.');
      } else {
        await saveMatch(match.member.id);
        toast.success('Match saved to your list!');
      }
      setAllMatches(prev =>
        prev.map(m =>
          m.member.id === match.member.id ? { ...m, isSaved: !isCurrentlySaved } : m
        )
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update saved match');
    }
  };

  const handleDismiss = async (memberId: string, memberName: string) => {
    try {
      await dismissMatch(memberId);
      setAllMatches(prev =>
        prev.map(m => (m.member.id === memberId ? { ...m, isDismissed: true } : m))
      );
      toast(`Match with ${memberName} dismissed`, {
        action: {
          label: 'Undo',
          onClick: async () => {
            await undismissMatch(memberId);
            setAllMatches(prev =>
              prev.map(m => (m.member.id === memberId ? { ...m, isDismissed: false } : m))
            );
          },
        },
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to dismiss match');
    }
  };

  const handleResetDismissed = async () => {
    const dismissedMembers = allMatches.filter(m => m.isDismissed);
    for (const m of dismissedMembers) {
      await undismissMatch(m.member.id).catch(() => null);
    }
    setAllMatches(prev => prev.map(m => ({ ...m, isDismissed: false })));
    toast.success('All dismissed matches restored.');
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedMatchType('all');
    setSelectedOverlapFilter('all');
    setSelectedExpertiseFilter('all');
    setSelectedFormatFilter('all');
    setSelectedLanguageFilter('all');
    setSelectedMinRating('0');
    setSortBy('best_match');
  };

  // Filter & Feed computation
  const filteredAndSortedMatches = useMemo(() => {
    let result = allMatches.filter(m => !m.isDismissed);

    // 1. Feed Tab Filtering
    switch (activeTab) {
      case 'best':
        result = result.filter(m => m.compatibilityScore >= 65 || m.matchType === 'reciprocal');
        break;
      case 'direct':
        result = result.filter(m => m.matchType === 'reciprocal');
        break;
      case 'teach_what_you_want':
        result = result.filter(m => m.skillsTheyTeachYouWant.length > 0);
        break;
      case 'want_what_you_teach':
        result = result.filter(m => m.skillsYouTeachTheyWant.length > 0);
        break;
      case 'available':
        result = result.filter(m => m.availabilityOverlapCount > 0);
        break;
      case 'nearby':
        result = result.filter(m => {
          if (!m.member.location && !m.member.city) return false;
          return m.scoreBreakdown.location >= 3.5;
        });
        break;
      case 'online':
        result = result.filter(m => m.member.preferred_format === 'Online' || m.member.preferred_format === 'Both');
        break;
      case 'new_matches':
        // Sort or filter recently created members
        result = [...result].sort((a, b) => new Date(b.member.created_at || 0).getTime() - new Date(a.member.created_at || 0).getTime());
        break;
      case 'saved':
        result = result.filter(m => m.isSaved);
        break;
      case 'all':
      default:
        break;
    }

    // 2. Keyword Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(m => {
        const nameMatch = (m.member.full_name || '').toLowerCase().includes(q) || (m.member.username || '').toLowerCase().includes(q);
        const bioMatch = (m.member.bio || '').toLowerCase().includes(q);
        const locMatch = (m.member.location || '').toLowerCase().includes(q) || (m.member.city || '').toLowerCase().includes(q);
        const teachSkillMatch = m.skillsTheyTeachYouWant.some(s => s.name.toLowerCase().includes(q));
        const learnSkillMatch = m.skillsYouTeachTheyWant.some(s => s.name.toLowerCase().includes(q));
        return nameMatch || bioMatch || locMatch || teachSkillMatch || learnSkillMatch;
      });
    }

    // 3. Category Filter
    if (selectedCategory !== 'all') {
      result = result.filter(m =>
        m.skillsTheyTeachYouWant.some(s => s.category_id === selectedCategory) ||
        m.skillsYouTeachTheyWant.some(s => s.category_id === selectedCategory)
      );
    }

    // 4. Match Type Filter
    if (selectedMatchType !== 'all') {
      result = result.filter(m => m.matchType === selectedMatchType);
    }

    // 5. Availability Overlap Filter
    if (selectedOverlapFilter !== 'all') {
      if (selectedOverlapFilter === 'any') {
        result = result.filter(m => m.availabilityOverlapCount > 0);
      } else if (selectedOverlapFilter === '30min') {
        result = result.filter(m => m.totalOverlapMinutes >= 30);
      } else if (selectedOverlapFilter === '60min') {
        result = result.filter(m => m.totalOverlapMinutes >= 60);
      } else if (selectedOverlapFilter === '90min') {
        result = result.filter(m => m.totalOverlapMinutes >= 90);
      } else if (selectedOverlapFilter === 'strict') {
        result = result.filter(m => m.totalOverlapMinutes >= 120);
      }
    }

    // 6. Teacher Minimum Level
    if (selectedExpertiseFilter !== 'all') {
      const ranks: Record<string, number> = { Intermediate: 2, Advanced: 3, Expert: 4 };
      const reqRank = ranks[selectedExpertiseFilter] || 2;
      result = result.filter(m => (m.scoreBreakdown.expertise || 0) >= (reqRank >= 3 ? 8 : 6));
    }

    // 7. Format Filter
    if (selectedFormatFilter !== 'all') {
      result = result.filter(m => m.member.preferred_format === selectedFormatFilter || m.member.preferred_format === 'Both');
    }

    // 8. Language Filter
    if (selectedLanguageFilter !== 'all') {
      result = result.filter(m => (m.member.languages || []).includes(selectedLanguageFilter));
    }

    // 9. Rating Filter
    const minR = parseFloat(selectedMinRating);
    if (minR > 0) {
      result = result.filter(m => (m.member.average_rating || 5.0) >= minR);
    }

    // 10. Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'highest_compatibility':
          return b.compatibilityScore - a.compatibilityScore;
        case 'best_availability':
          return b.totalOverlapMinutes - a.totalOverlapMinutes;
        case 'best_skills':
          return (b.skillsTheyTeachYouWant.length + b.skillsYouTeachTheyWant.length) - (a.skillsTheyTeachYouWant.length + a.skillsYouTeachTheyWant.length);
        case 'highest_rating':
          return (b.member.average_rating || 5.0) - (a.member.average_rating || 5.0);
        case 'newest':
          return new Date(b.member.created_at || 0).getTime() - new Date(a.member.created_at || 0).getTime();
        case 'best_match':
        default: {
          const priorityWeight = { reciprocal: 4, complementary: 3, one_way: 2, chain: 1 };
          const diff = priorityWeight[b.matchType] - priorityWeight[a.matchType];
          if (diff !== 0) return diff;
          return b.compatibilityScore - a.compatibilityScore;
        }
      }
    });

    return result;
  }, [
    allMatches,
    activeTab,
    searchQuery,
    selectedCategory,
    selectedMatchType,
    selectedOverlapFilter,
    selectedExpertiseFilter,
    selectedFormatFilter,
    selectedLanguageFilter,
    selectedMinRating,
    sortBy,
  ]);

  const dismissedCount = allMatches.filter(m => m.isDismissed).length;

  const getPriorityBadge = (type: MatchPriority) => {
    switch (type) {
      case 'reciprocal':
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] uppercase tracking-wide gap-1 shadow-xs">
            <Repeat className="h-3 w-3" />
            <span>Direct Reciprocal Match</span>
          </Badge>
        );
      case 'complementary':
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] uppercase tracking-wide gap-1 shadow-xs">
            <Sparkles className="h-3 w-3" />
            <span>Strong Complementary Match</span>
          </Badge>
        );
      case 'one_way':
      default:
        return (
          <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400 font-semibold text-[11px] uppercase tracking-wide gap-1">
            <GraduationCap className="h-3 w-3" />
            <span>One-Way Learning Match</span>
          </Badge>
        );
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-xl text-center space-y-4">
        <Sparkles className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">Sign In to See Your Smart Matches</h2>
        <p className="text-sm text-muted-foreground">
          Our rule-based engine computes personalized compatibility based on your exact teaching skills and learning desires.
        </p>
        <Link to="/login">
          <Button className="bg-primary text-primary-foreground font-semibold">Sign In / Register</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-7">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <span className="ed-meta">Multi-Factor Matching Engine</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-1">
            Smart Skill Matches
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl font-sans">
            Connects you based on canonical teaching skills, learning interests, timezone-normalized availability overlap, expertise level, and delivery formats.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dismissedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5 border-border"
              onClick={handleResetDismissed}
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span>Restore Dismissed ({dismissedCount})</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterDrawer(prev => !prev)}
            className="text-xs gap-1.5 font-semibold border-border"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters & Search</span>
            {(selectedCategory !== 'all' || selectedMatchType !== 'all' || selectedOverlapFilter !== 'all' || selectedMinRating !== '0' || searchQuery) && (
              <span className="w-2 h-2 rounded-full bg-accent inline-block ml-0.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Discovery Feeds Bar (Categorized Match Sections) */}
      <div className="border-b border-border/80 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-2 min-w-max">
          <button
            onClick={() => setActiveTab('best')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'best'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Best Matches</span>
          </button>

          <button
            onClick={() => setActiveTab('direct')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'direct'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Repeat className="h-3.5 w-3.5" />
            <span>Direct Reciprocal</span>
          </button>

          <button
            onClick={() => setActiveTab('teach_what_you_want')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'teach_what_you_want'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Teach What You Want</span>
          </button>

          <button
            onClick={() => setActiveTab('want_what_you_teach')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'want_what_you_teach'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Want What You Teach</span>
          </button>

          <button
            onClick={() => setActiveTab('available')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'available'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Schedule Overlap</span>
          </button>

          <button
            onClick={() => setActiveTab('nearby')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'nearby'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Nearby Peers</span>
          </button>

          <button
            onClick={() => setActiveTab('online')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'online'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Online Matches</span>
          </button>

          <button
            onClick={() => setActiveTab('new_matches')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'new_matches'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>New Members</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <BookmarkCheck className="h-3.5 w-3.5" />
            <span>Saved ({allMatches.filter(m => m.isSaved).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All ({allMatches.filter(m => !m.isDismissed).length})</span>
          </button>
        </div>
      </div>

      {/* Filter & Sorting Controls Box */}
      {showFilterDrawer && (
        <Card className="border-border bg-card shadow-xs animate-in fade-in-50 duration-200">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-bold text-foreground">Advanced Engine Filters</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs h-7">
                Reset All Filters
              </Button>
            </div>

            {/* Keyword Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by skill name, member name, bio, or city..."
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

            {/* Multi-attribute Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Skill Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Match Type</Label>
                <Select value={selectedMatchType} onValueChange={setSelectedMatchType}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All Match Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Match Types</SelectItem>
                    <SelectItem value="reciprocal">Direct Reciprocal Only</SelectItem>
                    <SelectItem value="complementary">Complementary Only</SelectItem>
                    <SelectItem value="one_way">One-Way Learning Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Availability Overlap</Label>
                <Select value={selectedOverlapFilter} onValueChange={setSelectedOverlapFilter}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Any Schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Schedule</SelectItem>
                    <SelectItem value="any">Any Overlapping Window</SelectItem>
                    <SelectItem value="30min">≥ 30 Minutes Overlap</SelectItem>
                    <SelectItem value="60min">≥ 60 Minutes Overlap</SelectItem>
                    <SelectItem value="90min">≥ 90 Minutes Overlap</SelectItem>
                    <SelectItem value="strict">≥ 2 Hours Overlap</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Teacher Expertise Level</Label>
                <Select value={selectedExpertiseFilter} onValueChange={setSelectedExpertiseFilter}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Any Expertise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Expertise Level</SelectItem>
                    <SelectItem value="Intermediate">Intermediate & Above</SelectItem>
                    <SelectItem value="Advanced">Advanced & Above</SelectItem>
                    <SelectItem value="Expert">Expert Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Delivery Format</Label>
                <Select value={selectedFormatFilter} onValueChange={setSelectedFormatFilter}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All Formats" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Formats</SelectItem>
                    <SelectItem value="Online">Online Sessions Only</SelectItem>
                    <SelectItem value="In-Person">In-Person Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Language</Label>
                <Select value={selectedLanguageFilter} onValueChange={setSelectedLanguageFilter}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All Languages" />
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
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Minimum Rating</Label>
                <Select value={selectedMinRating} onValueChange={setSelectedMinRating}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Any Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any Rating</SelectItem>
                    <SelectItem value="4.0">4.0+ Stars</SelectItem>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                    <SelectItem value="4.8">4.8+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Sort Matches By</Label>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best_match">Best Match (Recommended)</SelectItem>
                    <SelectItem value="highest_compatibility">Highest Compatibility Score</SelectItem>
                    <SelectItem value="best_availability">Most Schedule Overlap</SelectItem>
                    <SelectItem value="best_skills">Most Matching Skills</SelectItem>
                    <SelectItem value="highest_rating">Highest Rating</SelectItem>
                    <SelectItem value="newest">Newest Members First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Engine Transparency Notice */}
      <div className="p-4 rounded-xl border border-border/80 bg-card text-xs text-muted-foreground flex items-start gap-3 shadow-xs">
        <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-mono uppercase tracking-wider text-[11px] text-foreground font-bold">
            Transparent Deterministic Matching
          </p>
          <p>
            The engine evaluates real database relationships without artificial randomness. Compatibility weights:
            Skill Need Match (40%), Reciprocal Match (20%), Availability Overlap (15%), Expertise Compatibility (10%), Location Compatibility (5%), Format Compatibility (5%), Language (5%).
          </p>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>Showing {filteredAndSortedMatches.length} vetted peer matches</span>
        <span>Sorted by: {sortBy.replace('_', ' ').toUpperCase()}</span>
      </div>

      {/* Matches List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredAndSortedMatches.length === 0 ? (
        <Card className="border-dashed border-border py-14 text-center text-muted-foreground space-y-3">
          <Sparkles className="h-10 w-10 text-muted-foreground mx-auto stroke-1" />
          <h3 className="text-base font-semibold text-foreground">No matches found for your current criteria</h3>
          <p className="text-xs max-w-md mx-auto leading-relaxed">
            Try loosening some filters, selecting a different feed tab, or adding more learning interests or teaching skills to your profile.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button size="sm" variant="outline" onClick={clearAllFilters}>Reset Filters</Button>
            <Link to="/dashboard">
              <Button size="sm" className="bg-primary text-primary-foreground">Update My Skills</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredAndSortedMatches.map((match) => {
            const isSaved = match.isSaved;
            const isBreakdownExpanded = expandedBreakdownId === match.member.id;

            return (
              <Card key={match.member.id} className="border-border shadow-xs hover:border-primary/40 transition-all overflow-hidden bg-card">
                {/* Priority Banner Header */}
                <div className="px-6 py-2.5 bg-muted/40 border-b border-border/70 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(match.matchType)}
                    <span className="text-xs text-muted-foreground font-mono">
                      {match.matchType === 'reciprocal'
                        ? 'Two-Way Reciprocal Exchange'
                        : match.matchType === 'complementary'
                        ? 'High Synergy Exchange'
                        : 'Learning Opportunity'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {match.hasActiveRequest && (
                      <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40 text-emerald-600 bg-emerald-500/10">
                        Proposal {match.activeRequestStatus}
                      </Badge>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
                      onClick={() => handleToggleSave(match)}
                    >
                      {isSaved ? (
                        <>
                          <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                          <span className="text-primary font-medium">Saved</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="h-3.5 w-3.5" />
                          <span>Save</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1 px-2"
                      onClick={() => handleDismiss(match.member.id, match.member.full_name || match.member.username || 'Member')}
                      title="Dismiss match"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Dismiss</span>
                    </Button>
                  </div>
                </div>

                <CardContent className="p-6 space-y-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    {/* Left: Member Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <img
                        src={match.member.avatar_url || 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_660e9ae4-2f78-4f2b-8de1-1547d1387ee9.jpg'}
                        alt={match.member.full_name || 'Member'}
                        className="w-16 h-16 rounded-xl object-cover border border-border shadow-xs shrink-0"
                      />
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to={`/profile/${match.member.id}`} className="hover:underline">
                            <h2 className="font-bold text-lg text-foreground truncate">
                              {match.member.full_name || match.member.username}
                            </h2>
                          </Link>
                          <span className="text-xs text-muted-foreground font-mono">@{match.member.username}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {match.member.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-primary" /> {match.member.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-amber-500 font-medium">
                            <Star className="h-3.5 w-3.5 fill-amber-500" /> {match.member.average_rating || 5.0} ({match.member.total_reviews || 0} reviews)
                          </span>
                          <span className="flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5 text-primary" /> Trust: {match.member.reputation_score || 50}/100
                          </span>
                          {match.sharedLanguages.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3.5 w-3.5 text-primary" /> Shared: {match.sharedLanguages.join(', ')}
                            </span>
                          )}
                        </div>

                        {match.member.bio && (
                          <p className="text-xs text-muted-foreground line-clamp-2 max-w-xl leading-relaxed">
                            {match.member.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Compatibility Gauge & Action Triggers */}
                    <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground block font-medium">Compatibility Score</span>
                          <span className="text-2xl font-extrabold text-primary font-mono">{match.compatibilityScore}%</span>
                        </div>
                        <div className="w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center font-bold text-xs text-primary bg-primary/10 shadow-xs">
                          {match.compatibilityScore}%
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to={`/profile/${match.member.id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs gap-1 border-border">
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Profile</span>
                          </Button>
                        </Link>
                        <Link to="/chat">
                          <Button variant="outline" size="sm" className="h-8 text-xs gap-1 border-border">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Message</span>
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-primary text-primary-foreground font-semibold gap-1.5 shadow-xs"
                          onClick={() => handleOpenProposal(match)}
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                          <span>Send Exchange Request</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Skills Comparison Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-lg border border-border/80 bg-muted/20 space-y-1.5">
                      <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                          <span>They Can Teach (You Want)</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">{match.skillsTheyTeachYouWant.length} matches</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {match.skillsTheyTeachYouWant.length > 0 ? (
                          match.skillsTheyTeachYouWant.map((sk) => (
                            <Badge key={sk.id} variant="secondary" className="text-xs bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30">
                              {sk.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">General catalog portfolio</span>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg border border-border/80 bg-muted/20 space-y-1.5">
                      <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                          <span>They Want to Learn (You Offer)</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">{match.skillsYouTeachTheyWant.length} matches</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {match.skillsYouTeachTheyWant.length > 0 ? (
                          match.skillsYouTeachTheyWant.map((sk) => (
                            <Badge key={sk.id} variant="secondary" className="text-xs bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30">
                              {sk.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Open to diverse knowledge trades</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Overlapping Availability Section */}
                  {match.overlappingWindows && match.overlappingWindows.length > 0 && (
                    <div className="p-3 rounded-lg border border-border/80 bg-background text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-semibold text-foreground text-[11px] uppercase tracking-wider">
                        <span className="flex items-center gap-1.5 text-accent">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Overlapping Availability ({Math.round((match.totalOverlapMinutes / 60) * 10) / 10} hours / week in your time)</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground">Times converted to your local schedule</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {match.overlappingWindows.map((win, idx) => (
                          <Badge key={idx} variant="outline" className="text-[11px] font-mono border-border bg-muted/40">
                            {win.formattedOverlap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Why This Match? (Transparent Bulleted Reasons) */}
                  <div className="pt-3 border-t border-border/80 bg-muted/30 p-3.5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        <span>Why This Match?</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setExpandedBreakdownId(isBreakdownExpanded ? null : match.member.id)}
                        className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <span>{isBreakdownExpanded ? 'Hide Factor Breakdown' : 'View Factor Breakdown'}</span>
                        {isBreakdownExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {match.reasons.map((r, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-muted-foreground">
                          <span className="text-primary font-bold">{r.startsWith('✓') ? '' : '•'}</span>
                          <span className={r.startsWith('✓') ? 'text-foreground font-medium' : ''}>{r}</span>
                        </div>
                      ))}
                    </div>

                    {/* Detailed Scoring Factor Breakdown */}
                    {isBreakdownExpanded && (
                      <div className="mt-3 pt-3 border-t border-border/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-muted-foreground">
                        <div>Skill Need: <strong className="text-foreground">{match.scoreBreakdown.skillNeed}/40</strong></div>
                        <div>Reciprocity: <strong className="text-foreground">{match.scoreBreakdown.reciprocal}/20</strong></div>
                        <div>Availability: <strong className="text-foreground">{match.scoreBreakdown.availability}/15</strong></div>
                        <div>Expertise: <strong className="text-foreground">{match.scoreBreakdown.expertise}/10</strong></div>
                        <div>Location: <strong className="text-foreground">{match.scoreBreakdown.location}/5</strong></div>
                        <div>Format: <strong className="text-foreground">{match.scoreBreakdown.format}/5</strong></div>
                        <div>Language: <strong className="text-foreground">{match.scoreBreakdown.language}/5</strong></div>
                        <div>Total: <strong className="text-primary">{match.scoreBreakdown.total}/100</strong></div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* PROPOSAL MODAL */}
      <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              Propose Exchange to {selectedMatch?.member.full_name || selectedMatch?.member.username}
            </DialogTitle>
            <DialogDescription>
              Specify which skills to trade and include a friendly introduction.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendProposal} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Skill You Will Teach</Label>
              <Select value={teachSkillId} onValueChange={setTeachSkillId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select skill to teach..." />
                </SelectTrigger>
                <SelectContent>
                  {myTeachingSkills.map((ts) => (
                    <SelectItem key={ts.skill_id} value={ts.skill_id}>
                      {ts.skill?.name} ({ts.proficiency_level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Skill You Want to Learn from {selectedMatch?.member.full_name?.split(' ')[0]}</Label>
              <Select value={learnSkillId} onValueChange={setLearnSkillId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select skill to learn..." />
                </SelectTrigger>
                <SelectContent>
                  {(selectedMatch?.skillsTheyTeachYouWant || []).map((sk) => (
                    <SelectItem key={sk.id} value={sk.id}>
                      {sk.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={proposalMessage}
                onChange={(e) => setProposalMessage(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setProposalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground font-semibold">
                {submitting ? 'Sending Proposal...' : 'Send Proposal'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
