import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, ArrowLeft, Loader2, ShieldCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const { signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        toast.error(error.message || 'Login failed');
      } else {
        toast.success('Successfully logged in');
        navigate('/admin');
      }
    } catch {
      toast.error('Unexpected error during login');
    } finally {
      setLoading(false);
    }
  };

  const fillAdmin = () => {
    setEmail('admin@miaoda.com');
    setPassword('AdminPassword123!');
  };

  const fillUser = () => {
    setEmail('regular_user@miaoda.com');
    setPassword('UserPassword123!');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="space-y-1 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-2">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Portal Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access system maintenance and tools.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@miaoda.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Quick Demo Credentials */}
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Pre-configured Demo Accounts:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fillAdmin}
                  className="text-xs justify-start h-8"
                >
                  <ShieldCheck className="h-3.5 w-3.5 mr-1 text-primary" /> Admin Account
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fillUser}
                  className="text-xs justify-start h-8"
                >
                  <UserX className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> Non-Admin
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Sign In
            </Button>
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground text-center flex items-center justify-center gap-1 pt-2">
              <ArrowLeft className="h-3 w-3" /> Back to Admin Console
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
