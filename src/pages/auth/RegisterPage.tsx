import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !username || !email || !password || !confirmPassword) {
      setError('Please fill out all required fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const locationStr = [city.trim(), country.trim()].filter(Boolean).join(', ') || 'Global';

    setLoading(true);

    const { error: signUpError } = await signUp(email, password, {
      full_name: fullName.trim(),
      username: username.trim().toLowerCase(),
      location: locationStr,
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message || 'Registration failed. Email or username might already exist.');
      return;
    }

    toast.success('Account successfully registered! Welcome to SkillXChange.');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/20">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl tracking-tight text-foreground">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <span>Skill<span className="text-primary font-extrabold">X</span>Change</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Join the Community</h1>
          <p className="text-sm text-muted-foreground">Exchange what you know, learn what you love.</p>
        </div>

        <Card className="border-border shadow-sm">
          <form onSubmit={handleSubmit}>
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-lg">Create Your Peer Profile</CardTitle>
              <CardDescription>All fields help us match you with complementary peer learners</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullname">Full Name *</Label>
                  <Input
                    id="fullname"
                    type="text"
                    placeholder="e.g. Jordan Lee"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="e.g. jordan_tech"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jordan@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="e.g. Austin"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    type="text"
                    placeholder="e.g. United States"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="bg-muted/40 p-3 rounded-lg text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" /> Community Pledge
                </p>
                <p>
                  By creating an account, you agree to participate respectfully, show up for scheduled sessions, and offer genuine peer feedback.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full font-semibold gap-2" disabled={loading}>
                <UserPlus className="h-4 w-4" />
                {loading ? 'Creating profile...' : 'Register Account'}
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
