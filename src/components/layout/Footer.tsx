import { Link } from 'react-router-dom';
import { Shield, Heart, Globe, BookOpen } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/60 text-card-foreground mt-auto">
      {/* Editorial Masthead Rule */}
      <div className="sig-masthead-rule w-full" />

      <div className="container mx-auto px-4 py-12">
        {/* Editorial Pullquote Header */}
        <div className="mb-10 pb-8 border-b border-border/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <p className="ed-pullquote text-foreground font-serif italic text-lg md:text-xl">
              "Tell me and I forget. Teach me and I remember. Involve me and I learn."
            </p>
            <p className="ed-meta mt-2 ml-5">Benjamin Franklin — On Mutual Learning & Practice</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/explore">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider px-4 py-2 border border-foreground/30 hover:border-foreground rounded text-foreground transition-colors">
                <BookOpen className="h-3.5 w-3.5" /> Explore Skills Directory
              </span>
            </Link>
            <Link to="/register">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider px-4 py-2 bg-foreground text-background rounded hover:bg-foreground/90 transition-colors">
                Join Community
              </span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2.5 font-bold text-lg">
              <div className="w-8 h-8 rounded-md bg-foreground text-background flex items-center justify-center font-serif font-black text-base shadow-sm">
                X
              </div>
              <span className="font-serif text-xl font-bold tracking-tight">SkillXChange</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed font-sans">
              A community journal and reciprocal exchange platform. We believe high-value skills belong to those eager to share and learn.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <Globe className="h-3.5 w-3.5 text-accent" />
              <span className="font-mono uppercase tracking-wider text-[11px]">Decentralized Skill Registry</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-foreground font-bold mb-3">Skills Catalog</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/explore?category=Software" className="hover:text-foreground transition-colors">Software & System Architecture</Link></li>
              <li><Link to="/explore?category=Design" className="hover:text-foreground transition-colors">Editorial & Product Design</Link></li>
              <li><Link to="/explore?category=Languages" className="hover:text-foreground transition-colors">World Languages & Fluency</Link></li>
              <li><Link to="/explore?category=Music" className="hover:text-foreground transition-colors">Classical & Contemporary Music</Link></li>
              <li><Link to="/explore?category=Business" className="hover:text-foreground transition-colors">Leadership & Strategic Growth</Link></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-foreground font-bold mb-3">Pillars of Practice</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/community" className="hover:text-foreground transition-colors">Community Knowledge Forum</Link></li>
              <li><Link to="/matches" className="hover:text-foreground transition-colors">Weighted Matching Engine</Link></li>
              <li><span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-accent" /> Peer Reputation & Trust Metric</span></li>
              <li><span className="flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-accent" /> Zero-Dollar Reciprocity</span></li>
            </ul>
          </div>

          {/* Quick Access */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-foreground font-bold mb-3">Administration & Tools</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/dashboard" className="hover:text-foreground transition-colors">Member Dashboard</Link></li>
              <li><Link to="/login" className="hover:text-foreground transition-colors">Sign In To Desk</Link></li>
              <li>
                <Link to="/admin" className="inline-flex items-center gap-1 text-accent hover:underline font-medium text-sm">
                  <Shield className="h-3.5 w-3.5" /> Staff & Admin Portal
                </Link>
              </li>
              <li>
                <Link to="/admin/maintenance" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  Source Code Backup Utility
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground font-mono">
          <p>© 2026 SkillXChange Publication. All community exchanges conducted non-monetarily.</p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <span>TERMS</span>
            <span>PRIVACY</span>
            <span>CODE OF CONDUCT</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
