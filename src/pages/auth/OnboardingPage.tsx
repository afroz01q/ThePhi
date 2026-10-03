import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import {
  fetchSkills,
  fetchCategories,
  fetchCourses,
  addUserTeachingSkill,
  removeUserTeachingSkill,
  addUserLearningSkill,
  removeUserLearningSkill,
  fetchUserOnboardingDetails,
  saveOnboardingStepProgress,
  completeUserOnboarding,
  saveUserAvailability,
  getOrCreateCustomSkill,
} from '@/api/skillxchange';
import type { Skill, SkillCategory, Course, UserTeachingSkill, UserLearningSkill, ProficiencyLevel, TeachingFormat } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Search,
  BookOpen,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  User,
  ShieldCheck,
  Check,
  Clock,
  Layers,
  ArrowLeftRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { AvatarUploadDialog } from '@/components/profile/AvatarUploadDialog';

const PROFICIENCY_LEVELS: ProficiencyLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const FORMATS: TeachingFormat[] = ['Online', 'In-Person', 'Both'];
const AVAILABLE_LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese', 'Hindi', 'Arabic', 'Portuguese'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function OnboardingPage() {
  const { user, profile, refreshProfile, signUp } = useAuth();
  const navigate = useNavigate();

  // Wizard Step: 1 to 5
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Account
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 & 3 Catalog data
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTeach, setSearchTeach] = useState('');
  const [selectedTeachCat, setSelectedTeachCat] = useState('all');
  const [searchLearn, setSearchLearn] = useState('');
  const [selectedLearnCat, setSelectedLearnCat] = useState('all');
  const [learnTab, setLearnTab] = useState<'skills' | 'courses'>('skills');

  // User's added teaching & learning items
  const [myTeaching, setMyTeaching] = useState<UserTeachingSkill[]>([]);
  const [myLearning, setMyLearning] = useState<UserLearningSkill[]>([]);

  // Temp addition states for teaching
  const [addingSkillId, setAddingSkillId] = useState<string | null>(null);
  const [teachLevel, setTeachLevel] = useState<ProficiencyLevel>('Intermediate');
  const [teachExpYears, setTeachExpYears] = useState<number>(2);
  const [teachFormat, setTeachFormat] = useState<TeachingFormat>('Online');
  const [teachDesc, setTeachDesc] = useState('');

  // Temp addition states for learning
  const [addingLearnSkillId, setAddingLearnSkillId] = useState<string | null>(null);
  const [addingCourseId, setAddingCourseId] = useState<string | null>(null);
  const [learnCurLevel, setLearnCurLevel] = useState<ProficiencyLevel>('Beginner');
  const [learnTargetLevel, setLearnTargetLevel] = useState<ProficiencyLevel>('Advanced');
  const [learnNotes, setLearnNotes] = useState('');

  // Step 4: Profile Details
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['English']);
  const [experienceLevel, setExperienceLevel] = useState<ProficiencyLevel>('Intermediate');
  const [preferredFormat, setPreferredFormat] = useState<TeachingFormat>('Online');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4]); // Mon-Thu default
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);

  // Custom "Other" states for teaching, learning, and languages
  const [showCustomTeach, setShowCustomTeach] = useState(false);
  const [customTeachName, setCustomTeachName] = useState('');
  const [customTeachCatId, setCustomTeachCatId] = useState<string>('all');
  const [creatingCustomTeach, setCreatingCustomTeach] = useState(false);

  const [showCustomLearn, setShowCustomLearn] = useState(false);
  const [customLearnName, setCustomLearnName] = useState('');
  const [customLearnCatId, setCustomLearnCatId] = useState<string>('all');
  const [creatingCustomLearn, setCreatingCustomLearn] = useState(false);

  const [customLangInput, setCustomLangInput] = useState('');
  const [showCustomLangInput, setShowCustomLangInput] = useState(false);

  // Initial load
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [cats, allSk, allCo] = await Promise.all([
          fetchCategories(),
          fetchSkills(),
          fetchCourses(),
        ]);
        setCategories(cats);
        setSkills(allSk);
        setCourses(allCo);

        // If user is already authenticated, fetch their saved onboarding state
        if (user) {
          const details = await fetchUserOnboardingDetails(user.id);
          if (details.profile) {
            setFullName(details.profile.full_name || '');
            setUsername(details.profile.username || '');
            setEmail(details.profile.email || '');
            setBio(details.profile.bio || '');
            setCity(details.profile.city || '');
            setCountry(details.profile.country || '');
            setAvatarUrl(details.profile.avatar_url || '');
            if (details.profile.languages && details.profile.languages.length > 0) {
              setSelectedLangs(details.profile.languages);
            }
            if (details.profile.preferred_format) {
              setPreferredFormat(details.profile.preferred_format as TeachingFormat);
            }
            if (details.profile.experience_level) {
              setExperienceLevel(details.profile.experience_level as ProficiencyLevel);
            }

            // Restore step: if already passed step 1, resume from saved step or step 2
            const savedStep = details.profile.onboarding_step || 2;
            setCurrentStep(Math.max(2, savedStep));
          }
          setMyTeaching(details.teachingSkills as UserTeachingSkill[]);
          setMyLearning(details.learningSkills as UserLearningSkill[]);
        }
      } catch (err: any) {
        console.error('Error loading onboarding catalog:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  // Step 1: Create Account
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !username.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMsg('Please complete all account fields.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await signUp(email.trim(), password, {
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
      });

      if (error) throw error;

      toast.success('Account credentials created! Now choose what you can teach.');
      await refreshProfile();
      setCurrentStep(2);
      await saveOnboardingStepProgress(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account. Email or username might be taken.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Add Teaching Skill
  const handleAddTeachingSkill = async (skill: Skill) => {
    if (!user) return;
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await addUserTeachingSkill({
        skill_id: skill.id,
        proficiency_level: teachLevel,
        experience_years: teachExpYears,
        description: teachDesc.trim() || `Experienced in ${skill.name}`,
        format: teachFormat,
      });

      setMyTeaching(prev => [...prev, { ...res, skill }]);
      setAddingSkillId(null);
      setTeachDesc('');
      toast.success(`Added "${skill.name}" to what you can teach.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add teaching skill');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveTeachingSkill = async (id: string) => {
    try {
      await removeUserTeachingSkill(id);
      setMyTeaching(prev => prev.filter(s => s.id !== id));
      toast.info('Removed skill.');
    } catch (err: any) {
      toast.error(err.message || 'Could not remove skill');
    }
  };

  const handleProceedFromStep2 = async () => {
    setErrorMsg(null);
    if (myTeaching.length === 0) {
      setErrorMsg('Please select at least one skill you can teach.');
      toast.error('Please select at least one skill you can teach.');
      return;
    }
    await saveOnboardingStepProgress(3);
    setCurrentStep(3);
  };

  // Custom "Other" Teaching Skill handler
  const handleCreateAndAddCustomTeach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const trimmed = customTeachName.trim();
    if (!trimmed) {
      toast.error('Please enter a skill name.');
      return;
    }
    setCreatingCustomTeach(true);
    try {
      const newSkill = await getOrCreateCustomSkill(
        trimmed,
        customTeachCatId !== 'all' ? customTeachCatId : undefined
      );
      setSkills(prev => prev.some(s => s.id === newSkill.id) ? prev : [newSkill, ...prev]);
      await handleAddTeachingSkill(newSkill);
      setCustomTeachName('');
      setShowCustomTeach(false);
      toast.success(`Custom skill "${newSkill.name}" created and added!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add custom skill');
    } finally {
      setCreatingCustomTeach(false);
    }
  };

  // Custom "Other" Learning Skill handler
  const handleCreateAndAddCustomLearn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const trimmed = customLearnName.trim();
    if (!trimmed) {
      toast.error('Please enter a topic or skill name.');
      return;
    }
    setCreatingCustomLearn(true);
    try {
      const newSkill = await getOrCreateCustomSkill(
        trimmed,
        customLearnCatId !== 'all' ? customLearnCatId : undefined
      );
      setSkills(prev => prev.some(s => s.id === newSkill.id) ? prev : [newSkill, ...prev]);
      await handleAddLearningSkill(newSkill);
      setCustomLearnName('');
      setShowCustomLearn(false);
      toast.success(`Custom learning goal "${newSkill.name}" created and added!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add custom learning goal');
    } finally {
      setCreatingCustomLearn(false);
    }
  };

  // Custom "Other" Spoken Language handler
  const handleAddCustomLanguage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customLangInput.trim();
    if (!trimmed) return;
    if (!selectedLangs.map(l => l.toLowerCase()).includes(trimmed.toLowerCase())) {
      setSelectedLangs(prev => [...prev, trimmed]);
      toast.success(`Added "${trimmed}" to spoken languages.`);
    } else {
      toast.info(`"${trimmed}" is already added.`);
    }
    setCustomLangInput('');
    setShowCustomLangInput(false);
  };

  const handleRemoveCustomLanguage = (langToRemove: string) => {
    setSelectedLangs(prev => prev.filter(l => l !== langToRemove));
  };

  // Step 3: Add Learning Skill or Course
  const handleAddLearningSkill = async (skill: Skill) => {
    if (!user) return;
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await addUserLearningSkill({
        skill_id: skill.id,
        course_id: null,
        current_level: learnCurLevel,
        target_level: learnTargetLevel,
        priority: 'High',
        notes: learnNotes.trim() || `Interested in mastering ${skill.name}`,
        preferred_format: 'Online',
      });

      setMyLearning(prev => [...prev, { ...res, skill }]);
      setAddingLearnSkillId(null);
      setLearnNotes('');
      toast.success(`Added "${skill.name}" to your learning interests.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add learning skill');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCourse = async (course: Course) => {
    if (!user) return;
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const targetSkillId = course.primary_skill_id || skills[0]?.id;
      if (!targetSkillId) {
        toast.error('No linked skill found for this course.');
        return;
      }

      const res = await addUserLearningSkill({
        skill_id: targetSkillId,
        course_id: course.id,
        current_level: learnCurLevel,
        target_level: 'Advanced',
        priority: 'High',
        notes: `Enrolled interest in course: ${course.title}`,
        preferred_format: 'Online',
      });

      setMyLearning(prev => [...prev, { ...res, course, skill: course.primary_skill }]);
      setAddingCourseId(null);
      toast.success(`Enrolled interest in "${course.title}".`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add course interest');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveLearningSkill = async (id: string) => {
    try {
      await removeUserLearningSkill(id);
      setMyLearning(prev => prev.filter(s => s.id !== id));
      toast.info('Removed learning interest.');
    } catch (err: any) {
      toast.error(err.message || 'Could not remove learning interest');
    }
  };

  const handleProceedFromStep3 = async () => {
    setErrorMsg(null);
    if (myLearning.length === 0) {
      setErrorMsg('Please select at least one course or skill you want to learn.');
      toast.error('Please select at least one course or skill you want to learn.');
      return;
    }
    await saveOnboardingStepProgress(4);
    setCurrentStep(4);
  };

  // Step 4: Save Profile Details & Availability
  const handleProceedFromStep4 = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await saveOnboardingStepProgress(5, {
        bio: bio.trim(),
        city: city.trim(),
        country: country.trim(),
        full_name: fullName.trim(),
        languages: selectedLangs,
        experience_level: experienceLevel,
        preferred_format: preferredFormat,
        avatar_url: avatarUrl || undefined,
      });

      // Save initial availability
      if (selectedDays.length > 0) {
        const slots = selectedDays.map(d => ({
          day_of_week: d,
          start_time: '18:00',
          end_time: '20:00',
          is_online: preferredFormat !== 'In-Person',
          is_in_person: preferredFormat !== 'Online',
        }));
        await saveUserAvailability(slots);
      }

      setCurrentStep(5);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile details');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 5: Final Submission and Server-Side Atomic Onboarding Completion
  const handleFinalComplete = async () => {
    setErrorMsg(null);

    // Frontend validation invariants
    if (myTeaching.length === 0) {
      setErrorMsg('Please select at least one skill you can teach.');
      toast.error('Please select at least one skill you can teach.');
      setCurrentStep(2);
      return;
    }

    if (myLearning.length === 0) {
      setErrorMsg('Please select at least one course or skill you want to learn.');
      toast.error('Please select at least one course or skill you want to learn.');
      setCurrentStep(3);
      return;
    }

    setSubmitting(true);
    try {
      await completeUserOnboarding({
        full_name: fullName.trim() || undefined,
        bio: bio.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        languages: selectedLangs,
        experience_level: experienceLevel,
        preferred_format: preferredFormat,
        avatar_url: avatarUrl || undefined,
      });

      await refreshProfile();
      toast.success('Onboarding complete! Welcome to the SkillXChange community!');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to finalize profile. Server validation failed.');
      toast.error(err.message || 'Server validation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLangs(prev =>
      prev.includes(lang)
        ? (prev.length > 1 ? prev.filter(l => l !== lang) : prev)
        : [...prev, lang]
    );
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev =>
      prev.includes(dayIndex)
        ? (prev.length > 1 ? prev.filter(d => d !== dayIndex) : prev)
        : [...prev, dayIndex]
    );
  };

  // Filter skills for teaching catalog
  const filteredTeachingSkills = skills.filter(s => {
    const matchCat = selectedTeachCat === 'all' || s.category_id === selectedTeachCat;
    const matchQ = !searchTeach.trim() || s.name.toLowerCase().includes(searchTeach.toLowerCase().trim());
    const notAdded = !myTeaching.some(t => t.skill_id === s.id);
    return matchCat && matchQ && notAdded;
  });

  // Filter skills and courses for learning catalog
  const filteredLearningSkills = skills.filter(s => {
    const matchCat = selectedLearnCat === 'all' || s.category_id === selectedLearnCat;
    const matchQ = !searchLearn.trim() || s.name.toLowerCase().includes(searchLearn.toLowerCase().trim());
    const notAdded = !myLearning.some(l => l.skill_id === s.id && !l.course_id);
    return matchCat && matchQ && notAdded;
  });

  const filteredCourses = courses.filter(c => {
    const matchCat = selectedLearnCat === 'all' || c.category === selectedLearnCat;
    const matchQ = !searchLearn.trim() || c.title.toLowerCase().includes(searchLearn.toLowerCase().trim()) || (c.description && c.description.toLowerCase().includes(searchLearn.toLowerCase().trim()));
    const notAdded = !myLearning.some(l => l.course_id === c.id);
    return matchCat && matchQ && notAdded;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading SkillXChange catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl tracking-tight text-foreground">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <span>Skill<span className="text-accent font-extrabold">X</span>Change</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Member Onboarding</h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            SkillXChange connects peers through reciprocity. Every member must list at least one skill they can teach and at least one skill or course they wish to learn.
          </p>
        </div>

        {/* Step Progression Bar */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="grid grid-cols-5 gap-2 text-center text-xs font-medium">
            {[
              { num: 1, label: 'Account' },
              { num: 2, label: 'I Can Teach' },
              { num: 3, label: 'I Want to Learn' },
              { num: 4, label: 'Profile' },
              { num: 5, label: 'Review & Finish' },
            ].map(step => {
              const isPast = step.num < currentStep;
              const isCurrent = step.num === currentStep;
              return (
                <div key={step.num} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPast
                        ? 'bg-accent text-accent-foreground shadow-sm'
                        : isCurrent
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {isPast ? <Check className="h-4 w-4" /> : step.num}
                  </div>
                  <span className={`hidden sm:inline ${isCurrent ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {/* ================= STEP 1: ACCOUNT ================= */}
        {currentStep === 1 && (
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Step 1: Create Your Account</CardTitle>
              <CardDescription>Enter your credentials to establish your community membership</CardDescription>
            </CardHeader>
            <form onSubmit={handleStep1Submit}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="e.g. Elena Rostova"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      placeholder="e.g. elena_code"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password (8+ chars) *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground pt-2">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary font-semibold hover:underline">
                    Sign in here
                  </Link>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t border-border pt-4">
                <Button type="submit" disabled={submitting} className="gap-2">
                  <span>Continue to Teaching Skills</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* ================= STEP 2: WHAT CAN YOU TEACH? ================= */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-accent" />
                      <span>Step 2: What Can You Teach?</span>
                    </CardTitle>
                    <CardDescription>
                      <strong className="text-foreground">Required Business Rule:</strong> You must select at least 1 skill you can share with peers.
                    </CardDescription>
                  </div>
                  <Badge variant={myTeaching.length >= 1 ? 'default' : 'secondary'} className="self-start sm:self-auto">
                    {myTeaching.length} Selected (Min 1 required)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Active Teaching Skills List */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Your Teaching Portfolio ({myTeaching.length})
                  </div>
                  {myTeaching.length === 0 ? (
                    <div className="border border-dashed border-border rounded-xl p-6 text-center text-muted-foreground space-y-2 bg-muted/20">
                      <AlertCircle className="h-8 w-8 mx-auto text-amber-500" />
                      <p className="text-sm font-medium text-foreground">No teaching skills selected yet</p>
                      <p className="text-xs">
                        Browse the database catalog below and click &quot;Add to Teaching List&quot;. At least one skill is strictly required.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {myTeaching.map(t => (
                        <div
                          key={t.id}
                          className="flex items-start justify-between p-3.5 rounded-lg border border-border bg-card shadow-sm"
                        >
                          <div className="space-y-1 pr-2">
                            <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                              <span>{t.skill?.name || 'Skill'}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {t.proficiency_level}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {t.format} • {t.experience_years}y exp • {t.description}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                            onClick={() => handleRemoveTeachingSkill(t.id)}
                            title="Remove skill"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Catalog Search & Filters */}
                <div className="space-y-3 pt-4 border-t border-border">
                  {/* "Other" Custom Skill Action Bar */}
                  <div className="p-3.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary shrink-0" />
                      <div className="text-xs">
                        <span className="font-semibold text-foreground">Can&apos;t find your skill? </span>
                        <span className="text-muted-foreground">Add your own custom skill under &quot;Other&quot; to make it searchable by everyone.</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-semibold gap-1.5 border-primary text-primary hover:bg-primary/10 shrink-0"
                      onClick={() => setShowCustomTeach(!showCustomTeach)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{showCustomTeach ? 'Hide Other' : 'Other (Add Custom Skill)'}</span>
                    </Button>
                  </div>

                  {/* Inline Other Custom Skill Form */}
                  {showCustomTeach && (
                    <form
                      onSubmit={handleCreateAndAddCustomTeach}
                      className="p-4 rounded-xl border border-primary/40 bg-card shadow-sm space-y-3 animate-in fade-in"
                    >
                      <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span>Add &quot;Other&quot; Custom Skill You Can Teach</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium">Custom Skill Name *</Label>
                          <Input
                            placeholder="e.g. Sourdough Baking, Rust Programming, Vedic Math..."
                            value={customTeachName}
                            onChange={e => setCustomTeachName(e.target.value)}
                            className="h-8 text-xs"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium">Domain Category</Label>
                          <select
                            aria-label="Custom skill category"
                            value={customTeachCatId}
                            onChange={e => setCustomTeachCatId(e.target.value)}
                            className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                          >
                            <option value="all">Auto-assign (Other & Custom)</option>
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <Label className="text-[11px] font-medium">Your Level</Label>
                          <select
                            aria-label="Your proficiency level"
                            value={teachLevel}
                            onChange={e => setTeachLevel(e.target.value as ProficiencyLevel)}
                            className="w-full h-8 mt-1 px-2 rounded border border-input bg-background text-xs"
                          >
                            {PROFICIENCY_LEVELS.map(l => (
                              <option key={l} value={l}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-[11px] font-medium">Format</Label>
                          <select
                            aria-label="Format preference"
                            value={teachFormat}
                            onChange={e => setTeachFormat(e.target.value as TeachingFormat)}
                            className="w-full h-8 mt-1 px-2 rounded border border-input bg-background text-xs"
                          >
                            {FORMATS.map(f => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-[11px] font-medium">Years Exp</Label>
                          <Input
                            type="number"
                            min={0}
                            max={50}
                            value={teachExpYears}
                            onChange={e => setTeachExpYears(Number(e.target.value))}
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setShowCustomTeach(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          className="h-8 text-xs font-semibold bg-primary text-primary-foreground gap-1.5"
                          disabled={creatingCustomTeach || !customTeachName.trim()}
                        >
                          {creatingCustomTeach ? 'Creating...' : 'Add to Teaching List'}
                        </Button>
                      </div>
                    </form>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        placeholder="Search canonical skills (Python, UI/UX, Java, Guitar, Figma...)"
                        value={searchTeach}
                        onChange={e => setSearchTeach(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <select
                      aria-label="Filter by skill category"
                      value={selectedTeachCat}
                      onChange={e => setSelectedTeachCat(e.target.value)}
                      className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Skills Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
                    {filteredTeachingSkills.map(sk => {
                      const isConfiguring = addingSkillId === sk.id;
                      return (
                        <div
                          key={sk.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isConfiguring
                              ? 'border-primary ring-1 ring-primary bg-primary/5'
                              : 'border-border bg-card hover:border-primary/50'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="font-semibold text-sm text-foreground">{sk.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2">{sk.description}</div>
                          </div>

                          {isConfiguring ? (
                            <div className="mt-3 pt-3 border-t border-border/80 space-y-2.5 animate-in fade-in">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <label className="text-[11px] font-medium text-muted-foreground">Proficiency</label>
                                  <select
                                    aria-label="Proficiency level"
                                    value={teachLevel}
                                    onChange={e => setTeachLevel(e.target.value as ProficiencyLevel)}
                                    className="w-full h-8 mt-1 px-2 rounded border border-input bg-background text-xs"
                                  >
                                    {PROFICIENCY_LEVELS.map(l => (
                                      <option key={l} value={l}>
                                        {l}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[11px] font-medium text-muted-foreground">Format</label>
                                  <select
                                    aria-label="Teaching format"
                                    value={teachFormat}
                                    onChange={e => setTeachFormat(e.target.value as TeachingFormat)}
                                    className="w-full h-8 mt-1 px-2 rounded border border-input bg-background text-xs"
                                  >
                                    {FORMATS.map(f => (
                                      <option key={f} value={f}>
                                        {f}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="text-[11px] font-medium text-muted-foreground">Years of Experience</label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={50}
                                  value={teachExpYears}
                                  onChange={e => setTeachExpYears(Number(e.target.value))}
                                  className="h-8 text-xs mt-1"
                                />
                              </div>
                              <div className="flex gap-2 pt-1">
                                <Button
                                  size="sm"
                                  className="flex-1 h-8 text-xs"
                                  onClick={() => handleAddTeachingSkill(sk)}
                                  disabled={submitting}
                                >
                                  Confirm Skill
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-xs"
                                  onClick={() => setAddingSkillId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-3 h-8 text-xs gap-1.5"
                              onClick={() => {
                                setAddingSkillId(sk.id);
                                setTeachLevel('Intermediate');
                                setTeachExpYears(2);
                              }}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Select to Teach</span>
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-border pt-4">
                <Button variant="ghost" onClick={() => setCurrentStep(1)} disabled={submitting}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span>Back</span>
                </Button>
                <Button onClick={handleProceedFromStep2} className="gap-2">
                  <span>Continue to Learning Interests</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* ================= STEP 3: WHAT DO YOU WANT TO LEARN? ================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-accent" />
                      <span>Step 3: What Do You Want to Learn?</span>
                    </CardTitle>
                    <CardDescription>
                      <strong className="text-foreground">Required Business Rule:</strong> You must select at least 1 course or learning skill from the database.
                    </CardDescription>
                  </div>
                  <Badge variant={myLearning.length >= 1 ? 'default' : 'secondary'} className="self-start sm:self-auto">
                    {myLearning.length} Selected (Min 1 required)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Active Learning Interests List */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Your Learning Desires ({myLearning.length})
                  </div>
                  {myLearning.length === 0 ? (
                    <div className="border border-dashed border-border rounded-xl p-6 text-center text-muted-foreground space-y-2 bg-muted/20">
                      <AlertCircle className="h-8 w-8 mx-auto text-amber-500" />
                      <p className="text-sm font-medium text-foreground">No learning interests selected yet</p>
                      <p className="text-xs">
                        Select a curated course or a canonical skill from below. At least one learning goal is strictly required to power smart matching.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {myLearning.map(l => (
                        <div
                          key={l.id}
                          className="flex items-start justify-between p-3.5 rounded-lg border border-border bg-card shadow-sm"
                        >
                          <div className="space-y-1 pr-2">
                            <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                              <span>{l.course ? l.course.title : (l.skill?.name || 'Skill')}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {l.course ? 'Course' : `Target: ${l.target_level}`}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {l.course ? `${l.course.category} • ${l.course.duration}` : `Current: ${l.current_level} • ${l.notes || 'Skill Goal'}`}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                            onClick={() => handleRemoveLearningSkill(l.id)}
                            title="Remove learning interest"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tab Switcher: Courses vs Skills */}
                <div className="flex border-b border-border gap-6 pt-4">
                  <button
                    type="button"
                    onClick={() => setLearnTab('skills')}
                    className={`pb-2.5 text-sm font-semibold transition-colors flex items-center gap-2 ${
                      learnTab === 'skills'
                        ? 'border-b-2 border-primary text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Skills Catalog</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLearnTab('courses')}
                    className={`pb-2.5 text-sm font-semibold transition-colors flex items-center gap-2 ${
                      learnTab === 'courses'
                        ? 'border-b-2 border-primary text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Structured Courses ({courses.length})</span>
                  </button>
                </div>

                {/* Filter and Search */}
                <div className="space-y-3">
                  {/* "Other" Custom Learning Skill Action Bar */}
                  <div className="p-3.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary shrink-0" />
                      <div className="text-xs">
                        <span className="font-semibold text-foreground">Can&apos;t find your learning topic? </span>
                        <span className="text-muted-foreground">Add your own custom skill under &quot;Other&quot; so peers can find and offer it to you.</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-semibold gap-1.5 border-primary text-primary hover:bg-primary/10 shrink-0"
                      onClick={() => setShowCustomLearn(!showCustomLearn)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{showCustomLearn ? 'Hide Other' : 'Other (Add Custom Goal)'}</span>
                    </Button>
                  </div>

                  {/* Inline Other Custom Learning Skill Form */}
                  {showCustomLearn && (
                    <form
                      onSubmit={handleCreateAndAddCustomLearn}
                      className="p-4 rounded-xl border border-primary/40 bg-card shadow-sm space-y-3 animate-in fade-in"
                    >
                      <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span>Add &quot;Other&quot; Custom Skill You Want to Learn</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium">Topic or Skill Name *</Label>
                          <Input
                            placeholder="e.g. Japanese Kanji, Unreal Engine, Pottery, Latin..."
                            value={customLearnName}
                            onChange={e => setCustomLearnName(e.target.value)}
                            className="h-8 text-xs"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium">Category</Label>
                          <select
                            aria-label="Custom learning skill category"
                            value={customLearnCatId}
                            onChange={e => setCustomLearnCatId(e.target.value)}
                            className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                          >
                            <option value="all">Auto-assign (Other & Custom)</option>
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <Label className="text-[11px] font-medium">Your Current Level</Label>
                          <select
                            aria-label="Your current level"
                            value={learnCurLevel}
                            onChange={e => setLearnCurLevel(e.target.value as ProficiencyLevel)}
                            className="w-full h-8 mt-1 px-2 rounded border border-input bg-background text-xs"
                          >
                            {PROFICIENCY_LEVELS.map(l => (
                              <option key={l} value={l}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-[11px] font-medium">Target Desired Level</Label>
                          <select
                            aria-label="Target desired level"
                            value={learnTargetLevel}
                            onChange={e => setLearnTargetLevel(e.target.value as ProficiencyLevel)}
                            className="w-full h-8 mt-1 px-2 rounded border border-input bg-background text-xs"
                          >
                            {PROFICIENCY_LEVELS.map(l => (
                              <option key={l} value={l}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setShowCustomLearn(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          className="h-8 text-xs font-semibold bg-primary text-primary-foreground gap-1.5"
                          disabled={creatingCustomLearn || !customLearnName.trim()}
                        >
                          {creatingCustomLearn ? 'Creating...' : 'Add to Learning Goals'}
                        </Button>
                      </div>
                    </form>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        placeholder={learnTab === 'skills' ? 'Search learning skills...' : 'Search course titles or syllabi...'}
                        value={searchLearn}
                        onChange={e => setSearchLearn(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <select
                      aria-label="Filter learning catalog by category"
                      value={selectedLearnCat}
                      onChange={e => setSelectedLearnCat(e.target.value)}
                      className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Skills View */}
                  {learnTab === 'skills' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
                      {filteredLearningSkills.map(sk => {
                        const isConfiguring = addingLearnSkillId === sk.id;
                        return (
                          <div
                            key={sk.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isConfiguring
                                ? 'border-primary ring-1 ring-primary bg-primary/5'
                                : 'border-border bg-card hover:border-primary/50'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="font-semibold text-sm text-foreground">{sk.name}</div>
                              <div className="text-xs text-muted-foreground line-clamp-2">{sk.description}</div>
                            </div>

                            {isConfiguring ? (
                              <div className="mt-3 pt-3 border-t border-border/80 space-y-2.5 animate-in fade-in">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <label className="text-[11px] font-medium text-muted-foreground">Current Level</label>
                                    <select
                                      aria-label="Current proficiency level"
                                      value={learnCurLevel}
                                      onChange={e => setLearnCurLevel(e.target.value as ProficiencyLevel)}
                                      className="w-full h-8 mt-1 px-2 rounded border border-input bg-background text-xs"
                                    >
                                      {PROFICIENCY_LEVELS.map(l => (
                                        <option key={l} value={l}>
                                          {l}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-medium text-muted-foreground">Target Level</label>
                                    <select
                                      aria-label="Target proficiency level"
                                      value={learnTargetLevel}
                                      onChange={e => setLearnTargetLevel(e.target.value as ProficiencyLevel)}
                                      className="w-full h-8 mt-1 px-2 rounded border border-input bg-background text-xs"
                                    >
                                      {PROFICIENCY_LEVELS.map(l => (
                                        <option key={l} value={l}>
                                          {l}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <Button
                                    size="sm"
                                    className="flex-1 h-8 text-xs"
                                    onClick={() => handleAddLearningSkill(sk)}
                                    disabled={submitting}
                                  >
                                    Confirm Goal
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-xs"
                                    onClick={() => setAddingLearnSkillId(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-3 h-8 text-xs gap-1.5"
                                onClick={() => {
                                  setAddingLearnSkillId(sk.id);
                                  setLearnCurLevel('Beginner');
                                  setLearnTargetLevel('Advanced');
                                }}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>I Want to Learn This</span>
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Courses View */}
                  {learnTab === 'courses' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-1">
                      {filteredCourses.map(co => (
                        <div
                          key={co.id}
                          className="flex flex-col justify-between p-4 rounded-xl border border-border bg-card shadow-sm hover:border-primary/50 transition-all"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="font-medium text-primary">{co.category}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {co.duration}
                              </span>
                            </div>
                            <h2 className="font-bold text-sm text-foreground line-clamp-1">{co.title}</h2>
                            <p className="text-xs text-muted-foreground line-clamp-2">{co.description}</p>
                            <div className="text-[11px] text-muted-foreground">Instructor: {co.instructor}</div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 w-full h-8 text-xs gap-1.5"
                            onClick={() => handleAddCourse(co)}
                            disabled={submitting}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Enroll Learning Interest</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-border pt-4">
                <Button variant="ghost" onClick={() => setCurrentStep(2)} disabled={submitting}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span>Back</span>
                </Button>
                <Button onClick={handleProceedFromStep3} className="gap-2">
                  <span>Continue to Profile Setup</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* ================= STEP 4: PROFILE DETAILS ================= */}
        {currentStep === 4 && (
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Step 4: Your Profile & Availability</CardTitle>
              <CardDescription>Tell the community about yourself, your location, and preferred learning schedule</CardDescription>
            </CardHeader>
            <form onSubmit={handleProceedFromStep4}>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-border rounded-xl bg-muted/10">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center border border-border shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1 text-center sm:text-left">
                    <div className="font-semibold text-sm text-foreground">Profile Picture</div>
                    <div className="text-xs text-muted-foreground">
                      Upload a photo or paste an image URL to build community trust
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAvatarDialogOpen(true)}
                  >
                    Change Photo
                  </Button>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio & Teaching Style</Label>
                  <Textarea
                    id="bio"
                    rows={3}
                    placeholder="Briefly describe your background, what motivates you to share skills, and what you hope to achieve."
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                  />
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="e.g. San Francisco / London / Tokyo"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      placeholder="e.g. United States"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                    />
                  </div>
                </div>

                {/* Spoken Languages */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Spoken Languages (Select presets or add custom languages)</Label>
                    <span className="text-xs text-muted-foreground">{selectedLangs.length} added</span>
                  </div>
                  
                  {/* Preset & Custom Language Pills */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {AVAILABLE_LANGUAGES.map(lang => {
                      const isSelected = selectedLangs.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary font-medium shadow-sm'
                              : 'bg-card text-muted-foreground border-border hover:border-foreground/40'
                          }`}
                        >
                          {lang}
                        </button>
                      );
                    })}

                    {/* Custom Added Languages */}
                    {selectedLangs
                      .filter(l => !AVAILABLE_LANGUAGES.includes(l))
                      .map(customL => (
                        <span
                          key={customL}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-accent/15 text-accent-foreground border border-accent/40 font-medium"
                        >
                          <span>{customL}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomLanguage(customL)}
                            className="hover:text-destructive text-muted-foreground ml-0.5"
                            title={`Remove ${customL}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                  </div>

                  {/* "Other" Language Input */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {!showCustomLangInput ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 border-dashed border-primary/50 text-primary hover:bg-primary/5"
                        onClick={() => setShowCustomLangInput(true)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Other Language</span>
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 p-1.5 rounded-lg border border-primary/40 bg-muted/20 animate-in fade-in">
                        <Input
                          placeholder="e.g. Hindi, Telugu, Portuguese, Korean, Russian..."
                          value={customLangInput}
                          onChange={e => setCustomLangInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomLanguage();
                            }
                          }}
                          className="h-7 text-xs w-56 bg-background"
                          autoFocus
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 text-xs px-3 font-semibold bg-primary text-primary-foreground"
                          onClick={() => handleAddCustomLanguage()}
                          disabled={!customLangInput.trim()}
                        >
                          Add
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2 text-muted-foreground"
                          onClick={() => {
                            setCustomLangInput('');
                            setShowCustomLangInput(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Experience & Format */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experienceLevel">General Experience Level</Label>
                    <select
                      id="experienceLevel"
                      value={experienceLevel}
                      onChange={e => setExperienceLevel(e.target.value as ProficiencyLevel)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      {PROFICIENCY_LEVELS.map(l => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredFormat">Exchange Preference</Label>
                    <select
                      id="preferredFormat"
                      value={preferredFormat}
                      onChange={e => setPreferredFormat(e.target.value as TeachingFormat)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      {FORMATS.map(f => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Availability Days */}
                <div className="space-y-2">
                  <Label>Weekly Availability Days</Label>
                  <div className="grid grid-cols-7 gap-2 pt-1">
                    {DAYS.map((dayName, idx) => {
                      const isSelected = selectedDays.includes(idx);
                      return (
                        <button
                          key={dayName}
                          type="button"
                          onClick={() => toggleDay(idx)}
                          className={`h-9 rounded-md border text-xs font-semibold flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'bg-card text-muted-foreground border-border hover:bg-muted'
                          }`}
                        >
                          {dayName}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    You can fine-tune specific hourly slots in your Schedule Settings after onboarding.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-border pt-4">
                <Button variant="ghost" type="button" onClick={() => setCurrentStep(3)} disabled={submitting}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span>Back</span>
                </Button>
                <Button type="submit" disabled={submitting} className="gap-2">
                  <span>Review & Finalize</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* ================= STEP 5: REVIEW & COMPLETE SIGN UP ================= */}
        {currentStep === 5 && (
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <span>Step 5: Review & Complete Sign Up</span>
              </CardTitle>
              <CardDescription>
                Confirm your teaching inventory and learning objectives before finalizing your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Teaching skills summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-accent" />
                    <span>Skills You Can Teach ({myTeaching.length})</span>
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)} className="h-7 text-xs">
                    Edit
                  </Button>
                </div>
                {myTeaching.length === 0 ? (
                  <div className="text-sm text-destructive font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Please select at least one skill you can teach.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {myTeaching.map(t => (
                      <div key={t.id} className="p-3 border border-border rounded-lg bg-card text-xs space-y-1">
                        <div className="font-semibold text-foreground">{t.skill?.name}</div>
                        <div className="text-muted-foreground">{t.proficiency_level} • {t.format} • {t.experience_years} years exp</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Learning interests summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-accent" />
                    <span>Skills / Courses You Want to Learn ({myLearning.length})</span>
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(3)} className="h-7 text-xs">
                    Edit
                  </Button>
                </div>
                {myLearning.length === 0 ? (
                  <div className="text-sm text-destructive font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Please select at least one course or skill you want to learn.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {myLearning.map(l => (
                      <div key={l.id} className="p-3 border border-border rounded-lg bg-card text-xs space-y-1">
                        <div className="font-semibold text-foreground">
                          {l.course ? l.course.title : l.skill?.name}
                        </div>
                        <div className="text-muted-foreground">
                          {l.course ? `Course • ${l.course.category}` : `Target: ${l.target_level}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Profile details summary */}
              <div className="space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="font-medium text-foreground">Name: </span>
                    {fullName || profile?.full_name || 'Member'}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Location: </span>
                    {[city, country].filter(Boolean).join(', ') || 'Global'}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Languages: </span>
                    {selectedLangs.join(', ')}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 text-xs text-foreground space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-accent">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Server-Validated Reciprocal Standard</span>
                </div>
                <p className="text-muted-foreground">
                  Upon completion, your profile enters the active matching engine. You will maintain at least one teaching skill and one learning interest at all times.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border pt-4">
              <Button variant="ghost" onClick={() => setCurrentStep(4)} disabled={submitting}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span>Back</span>
              </Button>
              <Button
                onClick={handleFinalComplete}
                disabled={submitting || myTeaching.length === 0 || myLearning.length === 0}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Validating & Finalizing...</span>
                  </div>
                ) : (
                  <>
                    <span>Complete Sign Up</span>
                    <Check className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>

      {/* Avatar Dialog */}
      {user && (
        <AvatarUploadDialog
          open={avatarDialogOpen}
          onOpenChange={setAvatarDialogOpen}
          userId={user.id}
          currentAvatarUrl={avatarUrl}
          onAvatarUpdated={newUrl => setAvatarUrl(newUrl)}
        />
      )}
    </div>
  );
}
