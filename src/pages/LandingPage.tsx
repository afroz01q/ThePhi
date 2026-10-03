import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeftRight,
  Search,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Award,
  Users,
  Clock,
  ChevronRight,
  BookOpen,
  Code,
  Palette,
  Languages,
  Briefcase,
  Music,
  Activity,
  HeartHandshake,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { fetchCategories, fetchAdminKPIs, fetchSkills } from '@/api/skillxchange';
import type { SkillCategory, Skill } from '@/types/types';

export function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [kpis, setKpis] = useState({
    totalUsers: 6,
    totalSkills: 11,
    activeExchanges: 1,
    completedSessions: 0,
    matchSuccessRate: 92,
  });

  useEffect(() => {
    Promise.all([
      fetchCategories().catch(() => []),
      fetchSkills().catch(() => []),
      fetchAdminKPIs().catch(() => ({
        totalUsers: 6,
        totalSkills: 11,
        activeExchanges: 1,
        completedSessions: 0,
        matchSuccessRate: 92,
      })),
    ]).then(([cats, sks, stats]) => {
      setCategories(cats);
      setSkills(sks);
      if (stats) {
        setKpis(stats as any);
      }
    });
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?query=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Code': return <Code className="h-4 w-4" />;
      case 'Palette': return <Palette className="h-4 w-4" />;
      case 'Languages': return <Languages className="h-4 w-4" />;
      case 'Briefcase': return <Briefcase className="h-4 w-4" />;
      case 'Music': return <Music className="h-4 w-4" />;
      case 'Activity': return <Activity className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 1. EDITORIAL COVER HERO */}
      <section className="relative pt-12 pb-16 md:pt-16 md:pb-24 border-b border-border/80">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Top Issue Meta Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 mb-8 border-b border-border/60">
            <span className="ed-meta">Special Edition // Vol. 24 • Peer Exchange Chronicle</span>
            <div className="flex items-center gap-3 ed-meta text-[11px]">
              <span>Verified Non-Monetary</span>
              <span className="text-border">|</span>
              <span className="text-accent font-semibold">Decentralized Practice</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Headline Column */}
            <div className="lg:col-span-8 space-y-6">
              <Badge variant="outline" className="px-3 py-1 text-xs font-mono tracking-wider uppercase border-foreground/30 text-foreground">
                The Reciprocal Knowledge Society
              </Badge>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-black tracking-tight text-foreground leading-[1.08]">
                Learn Something New. <br />
                <span className="italic font-normal text-accent">Teach What You Know.</span>
              </h1>

              <p className="ed-dropcap text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl font-sans">
                Knowledge has always flourished most rapidly through personal reciprocity. Connect with genuine practitioners across design, programming, languages, and craft. Exchange your expertise without transaction fees or commercial paywalls.
              </p>

              {/* Editorial Search Bar */}
              <form onSubmit={handleSearchSubmit} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search discipline (e.g. Python, UI/UX, Spanish, Guitar)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 bg-card border-border/90 text-foreground text-sm rounded-md shadow-sm"
                  />
                </div>
                <Button type="submit" className="h-11 px-6 bg-foreground text-background hover:bg-foreground/90 font-medium tracking-wide uppercase text-xs rounded-md shrink-0">
                  Find a Skill
                </Button>
              </form>

              {/* Action Links */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {user ? (
                  <Link to="/dashboard">
                    <Button className="h-11 px-6 bg-foreground text-background font-semibold text-xs tracking-wider uppercase rounded-md shadow-sm">
                      Go to My Desk <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/register">
                      <Button className="h-11 px-6 bg-foreground text-background font-semibold text-xs tracking-wider uppercase rounded-md shadow-sm">
                        Create Account <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Link to="/explore">
                      <Button variant="outline" className="h-11 px-5 font-semibold text-xs tracking-wider uppercase border-border rounded-md">
                        Browse Members
                      </Button>
                    </Link>
                  </>
                )}
                <Link to="/matches">
                  <Button variant="ghost" className="h-11 px-4 text-xs font-semibold tracking-wider uppercase text-accent hover:text-accent gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Smart Match Engine
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Mini Journal Card */}
            <div className="lg:col-span-4">
              <div className="ed-card p-6 border border-border/80 space-y-5 bg-card">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Community Index</span>
                  <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                </div>

                <div className="space-y-4 text-left">
                  <div>
                    <span className="ed-meta">Active Practitioners</span>
                    <p className="text-3xl font-serif font-bold text-foreground mt-0.5">{kpis.totalUsers} Members</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Verified peer credentials</p>
                  </div>
                  <div className="pt-3 border-t border-border/50">
                    <span className="ed-meta">Indexed Skills</span>
                    <p className="text-3xl font-serif font-bold text-foreground mt-0.5">{kpis.totalSkills} Disciplines</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Structured peer catalog</p>
                  </div>
                  <div className="pt-3 border-t border-border/50">
                    <span className="ed-meta">Match Compatibility</span>
                    <p className="text-3xl font-serif font-bold text-foreground mt-0.5">{kpis.matchSuccessRate}%</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Algorithm alignment accuracy</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/60">
                  <p className="text-xs text-muted-foreground italic font-serif">
                    "True mastery is cemented when one communicates it to an attentive peer."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS (FOUR-COLUMN EDITORIAL SPREAD) */}
      <section className="py-16 md:py-20 bg-muted/20 border-b border-border/80">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col sm:flex-row items-baseline justify-between mb-10 pb-4 border-b border-border/60">
            <div>
              <span className="ed-meta">Methodology</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mt-1">How SkillXChange Operates</h2>
            </div>
            <p className="text-xs font-mono uppercase text-muted-foreground mt-2 sm:mt-0 tracking-wider">
              A Four-Step Reciprocal Model
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="ed-card p-6 bg-card border border-border/70 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-accent uppercase tracking-widest block mb-2">Step 01</span>
                <h3 className="font-serif font-bold text-lg mb-2 text-foreground">Catalog Your Skills</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                  Register what you can teach with proficiency levels and highlight what you aspire to learn next.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-border/40 text-xs font-mono text-muted-foreground">
                Teaching & Learning Lists
              </div>
            </div>

            <div className="ed-card p-6 bg-card border border-border/70 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-accent uppercase tracking-widest block mb-2">Step 02</span>
                <h3 className="font-serif font-bold text-lg mb-2 text-foreground">Algorithmic Pairing</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                  The matching engine pairs you with peers who teach what you want and wish to learn what you offer.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-border/40 text-xs font-mono text-muted-foreground">
                Reciprocal Alignment
              </div>
            </div>

            <div className="ed-card p-6 bg-card border border-border/70 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-accent uppercase tracking-widest block mb-2">Step 03</span>
                <h3 className="font-serif font-bold text-lg mb-2 text-foreground">Send Proposal</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                  Agree upon exchange terms, chat in real-time, clarify goals, and confirm learning formats.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-border/40 text-xs font-mono text-muted-foreground">
                Direct Peer Dialogue
              </div>
            </div>

            <div className="ed-card p-6 bg-card border border-border/70 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-accent uppercase tracking-widest block mb-2">Step 04</span>
                <h3 className="font-serif font-bold text-lg mb-2 text-foreground">Schedule & Endorse</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                  Conduct 1-on-1 sessions on calendar, track milestones, write peer reviews, and cultivate trust.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-border/40 text-xs font-mono text-muted-foreground">
                Reputation Growth
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CASE STUDY SHOWCASE (RECIPROCAL EXCHANGE DIALOGUE) */}
      <section className="py-16 md:py-20 bg-background border-b border-border/80">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col sm:flex-row items-baseline justify-between mb-8 pb-4 border-b border-border/60">
            <div>
              <span className="ed-meta">Case Study</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mt-1">Elena & Marcus: The Design-to-Code Trade</h2>
            </div>
            <Badge variant="outline" className="text-[11px] font-mono uppercase tracking-wider text-accent border-accent/40 mt-2 sm:mt-0">
              Verified Active Exchange
            </Badge>
          </div>

          <div className="ed-card p-6 sm:p-8 bg-card border border-border/90">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Partner 1 */}
              <div className="md:col-span-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="ed-zoom-frame w-14 h-14 rounded-full border border-border">
                    <img
                      src="https://miaoda-site-img.s3cdn.medo.dev/images/KLing_2e9c2aa7-8bc8-4cbe-aa08-626c5833e161.jpg"
                      alt="Elena Rostova"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-lg text-foreground">Elena Rostova</h4>
                    <p className="text-xs text-muted-foreground font-mono">Senior UI Designer • Berlin</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-muted/40 border-l-2 border-accent rounded-r">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">Teaches</span>
                    <span className="font-medium text-foreground text-sm">Design Systems & Figma Prototyping</span>
                  </div>
                  <div className="p-3 bg-muted/40 border-l-2 border-foreground/30 rounded-r">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">Learns</span>
                    <span className="font-medium text-foreground text-sm">Python Scripting & Data Parsing</span>
                  </div>
                </div>
              </div>

              {/* Match Details Middle */}
              <div className="md:col-span-2 text-center py-4 border-y md:border-y-0 md:border-x border-border/70 flex flex-col items-center justify-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                  <ArrowLeftRight className="h-4 w-4" />
                </div>
                <span className="font-serif font-bold text-lg text-foreground">96%</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Compatibility</span>
                <span className="text-[11px] text-accent font-medium">Overlapping Evenings</span>
              </div>

              {/* Partner 2 */}
              <div className="md:col-span-5 space-y-4">
                <div className="flex items-center gap-3 md:flex-row-reverse">
                  <div className="ed-zoom-frame w-14 h-14 rounded-full border border-border">
                    <img
                      src="https://miaoda-site-img.s3cdn.medo.dev/images/KLing_f653f35f-f7f9-4d9e-bf1b-857c7aac8dae.jpg"
                      alt="Marcus Vance"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="md:text-right">
                    <h4 className="font-serif font-bold text-lg text-foreground">Marcus Vance</h4>
                    <p className="text-xs text-muted-foreground font-mono">Backend Engineer • Austin</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-muted/40 border-l-2 border-accent rounded-r md:text-right md:border-l-0 md:border-r-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">Teaches</span>
                    <span className="font-medium text-foreground text-sm">Python Architecture & API Design</span>
                  </div>
                  <div className="p-3 bg-muted/40 border-l-2 border-foreground/30 rounded-r md:text-right md:border-l-0 md:border-r-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">Learns</span>
                    <span className="font-medium text-foreground text-sm">Design Systems & Figma Prototyping</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
              <span className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-accent" />
                <span className="text-foreground font-medium">Session #3 Completed</span> — Milestone: "Automated Theme Export Scripts"
              </span>
              <Link to="/matches">
                <span className="text-foreground hover:underline font-mono uppercase text-[11px] tracking-wider inline-flex items-center gap-1">
                  Discover Your Match <ChevronRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CURATED SKILL CATEGORIES */}
      <section className="py-16 md:py-20 bg-muted/20 border-b border-border/80">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col sm:flex-row items-baseline justify-between mb-10 pb-4 border-b border-border/60">
            <div>
              <span className="ed-meta">Curated Disciplines</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mt-1">Explore by Domain</h2>
            </div>
            <Link to="/explore">
              <span className="text-xs font-mono uppercase tracking-wider text-foreground hover:underline inline-flex items-center gap-1">
                View All {skills.length} Skills <ChevronRight className="h-3 w-3" />
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {categories.map((cat) => (
              <Link key={cat.id} to={`/explore?categoryId=${cat.id}`} className="group block">
                <div className="ed-card p-5 bg-card border border-border/80 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded border border-border/80 flex items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
                        {getCategoryIcon(cat.icon)}
                      </div>
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">Cat. 0{cat.display_order}</span>
                    </div>
                    <h3 className="font-serif font-bold text-base text-foreground group-hover:text-accent transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                      {cat.description || 'Structured peer exchanges and mentorship in this area.'}
                    </p>
                  </div>
                  <div className="pt-3 mt-4 border-t border-border/40 text-[11px] font-mono text-muted-foreground flex items-center justify-between">
                    <span>Inspect peers</span>
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. TRUST, REPUTATION & SAFETY PILLARS */}
      <section className="py-16 md:py-20 bg-background border-b border-border/80">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="ed-meta">Pillars of Integrity</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mt-1">Built Upon Verifiable Trust</h2>
            <p className="text-sm text-muted-foreground mt-2 font-sans">
              Our community functions without monetary currency. Reputation is earned strictly through reliable attendance, peer reviews, and verified skill endorsements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="ed-card p-6 bg-card border border-border/80 space-y-3">
              <div className="w-9 h-9 rounded border border-border flex items-center justify-center text-accent">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="font-serif font-bold text-base text-foreground">Verified Session Reviews</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Reviews cannot be written arbitrarily. Only members who have scheduled and completed real calendar sessions can post ratings.
              </p>
            </div>

            <div className="ed-card p-6 bg-card border border-border/80 space-y-3">
              <div className="w-9 h-9 rounded border border-border flex items-center justify-center text-accent">
                <Award className="h-4 w-4" />
              </div>
              <h3 className="font-serif font-bold text-base text-foreground">Earned Endorsements</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Skill endorsements are awarded directly to your profile by peers whom you have mentored, visible across the community.
              </p>
            </div>

            <div className="ed-card p-6 bg-card border border-border/80 space-y-3">
              <div className="w-9 h-9 rounded border border-border flex items-center justify-center text-accent">
                <HeartHandshake className="h-4 w-4" />
              </div>
              <h3 className="font-serif font-bold text-base text-foreground">Zero-Dollar Reciprocity</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                No tipping, subscriptions, or credit packages. Equal, dignified exchange of skill and attention between motivated humans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="py-16 md:py-20 bg-muted/20 border-b border-border/80">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <span className="ed-meta">Inquiries</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mt-1">Frequently Pondered Questions</h2>
          </div>

          <div className="space-y-4">
            <div className="ed-card p-5 bg-card border border-border/80">
              <h4 className="font-serif font-bold text-base flex items-center gap-2 text-foreground">
                <HelpCircle className="h-4 w-4 text-accent shrink-0" />
                Is SkillXChange truly non-monetary?
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 pl-6 leading-relaxed">
                Yes. SkillXChange is deliberately structured to operate without cash transactions. You contribute knowledge in subjects you have mastered, and in return receive personalized tutoring from other peers in their respective specialties.
              </p>
            </div>

            <div className="ed-card p-5 bg-card border border-border/80">
              <h4 className="font-serif font-bold text-base flex items-center gap-2 text-foreground">
                <HelpCircle className="h-4 w-4 text-accent shrink-0" />
                How does the matching engine evaluate partners?
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 pl-6 leading-relaxed">
                The compatibility engine weights reciprocal skill alignment (40%), single-direction relevance (20%), overlapping weekly availability slots (20%), spoken language compatibility (10%), and historical peer attendance (10%). Every match card details the precise reasons for the score.
              </p>
            </div>

            <div className="ed-card p-5 bg-card border border-border/80">
              <h4 className="font-serif font-bold text-base flex items-center gap-2 text-foreground">
                <HelpCircle className="h-4 w-4 text-accent shrink-0" />
                How are session commitments safeguarded?
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 pl-6 leading-relaxed">
                Unexcused session absences or no-shows deduct points from a member's public trust rating. Active attendance and 5-star session feedback raise your reputation score and elevate match priority.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. EDITORIAL FINAL CALL */}
      <section className="py-20 bg-foreground text-background">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-6">
          <span className="font-mono text-xs uppercase tracking-widest text-background/60">An Invitation to Learn</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight text-balance leading-tight">
            Exchange your craft with curious peers worldwide.
          </h2>
          <p className="text-sm sm:text-base text-background/80 max-w-xl mx-auto font-sans leading-relaxed">
            Begin your journey today. Register your skills, discover complementary partners, and experience collaborative learning at its finest.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="h-11 px-7 bg-background text-foreground hover:bg-background/90 text-xs font-semibold tracking-wider uppercase rounded-md shadow">
                Join SkillXChange
              </Button>
            </Link>
            <Link to="/explore">
              <Button size="lg" variant="ghost" className="h-11 px-6 border border-background/40 text-background hover:bg-background/10 text-xs font-semibold tracking-wider uppercase rounded-md">
                Explore Skills
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
