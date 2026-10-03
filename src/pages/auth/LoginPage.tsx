import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeftRight, LogIn, AlertCircle, Sparkles, UserCheck, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: signInError } = await signInWithEmail(email, password);

    if (signInError) {
      setError(signInError.message || 'Invalid email or password.');
      setLoading(false);
      return;
    }

    // Check onboarding status directly upon login
    const { data: { user: loggedInUser } } = await supabase.auth.getUser();
    if (loggedInUser) {
      const { data: prof } = await supabase.from('profiles').select('onboarding_status').eq('id', loggedInUser.id).maybeSingle();
      if (prof && prof.onboarding_status !== 'completed') {
        toast.info('Please complete your onboarding profile setup.');
        navigate('/onboarding', { replace: true });
        return;
      }
    }

    toast.success('Successfully signed in! Welcome back.');
    navigate(from, { replace: true });
  };

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setLoading(true);
    setError(null);

    const { error: err } = await signInWithEmail(quickEmail, quickPass);
    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    toast.success('Signed in as ' + quickEmail);
    navigate(from, { replace: true });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setResetLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (resetErr) throw resetErr;
      setResetSent(true);
      toast.success('Password reset email instructions sent.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send password reset');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/20">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl tracking-tight text-foreground">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <span>Skill<span className="text-primary font-extrabold">X</span>Change</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to exchange skills with peer learners worldwide</p>
        </div>

        <Card className="border-border shadow-sm">
          <form onSubmit={handleSubmit}>
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-lg">Sign In</CardTitle>
              <CardDescription>Enter your email and password to access your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <button type="button" className="text-xs text-primary hover:underline">
                        Forgot password?
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Reset your password</DialogTitle>
                        <DialogDescription>
                          Enter your account email to receive a password reset link.
                        </DialogDescription>
                      </DialogHeader>
                      {resetSent ? (
                        <div className="py-4 text-center space-y-3">
                          <p className="text-sm text-foreground">
                            A recovery link has been sent to <strong>{resetEmail}</strong> if an account exists.
                          </p>
                          <Button size="sm" onClick={() => setDialogOpen(false)}>Done</Button>
                        </div>
                      ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">Your email address</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              placeholder="name@example.com"
                              required
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={resetLoading}>
                              {resetLoading ? 'Sending...' : 'Send Reset Link'}
                            </Button>
                          </div>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full font-semibold gap-2" disabled={loading}>
                <LogIn className="h-4 w-4" />
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary font-medium hover:underline">
                  Create account
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
