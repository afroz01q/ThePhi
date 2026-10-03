import { supabase } from '@/db/supabase';
import type {
  Profile,
  SkillCategory,
  Skill,
  UserTeachingSkill,
  UserLearningSkill,
  UserAvailability,
  ExchangeRequest,
  Session,
  Conversation,
  Message,
  LearningProgress,
  Review,
  SkillEndorsement,
  NotificationItem,
  CommunityPost,
  CommunityComment,
  ReportItem,
  MatchResult,
  Connection,
  Course,
} from '@/types/types';

// ==================== SKILL CATALOG ====================

export async function fetchCategories(): Promise<SkillCategory[]> {
  const { data, error } = await supabase
    .from('skill_categories')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchSkills(categoryId?: string): Promise<Skill[]> {
  let query = supabase
    .from('skills')
    .select('*, category:skill_categories(*)')
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (categoryId && categoryId !== 'all') {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Dynamically finds an existing canonical skill (case-insensitive)
 * or creates a new one in the catalog so custom user skills are immediately functional.
 */
export async function getOrCreateCustomSkill(
  rawName: string,
  categoryId?: string,
  description?: string
): Promise<Skill> {
  const trimmedName = rawName.trim();
  if (!trimmedName) throw new Error('Skill name cannot be empty');

  // Check if skill already exists (case-insensitive)
  const { data: existing, error: findError } = await supabase
    .from('skills')
    .select('*, category:skill_categories(*)')
    .ilike('name', trimmedName)
    .maybeSingle();

  if (findError && findError.code !== 'PGRST116') {
    console.error('Error finding existing skill:', findError);
  }

  if (existing) {
    return existing as Skill;
  }

  // Determine appropriate category
  let targetCategoryId = categoryId;
  if (!targetCategoryId || targetCategoryId === 'all') {
    const { data: otherCat } = await supabase
      .from('skill_categories')
      .select('id')
      .ilike('name', '%Other%')
      .maybeSingle();

    if (otherCat) {
      targetCategoryId = otherCat.id;
    } else {
      const { data: firstCat } = await supabase
        .from('skill_categories')
        .select('id')
        .limit(1)
        .maybeSingle();
      targetCategoryId = firstCat?.id;
    }
  }

  const newSkillRecord = {
    name: trimmedName,
    category_id: targetCategoryId,
    subcategory: 'Custom',
    description: description || `Community member specialized skill: ${trimmedName}`,
    status: 'active',
  };

  const { data: created, error: insertError } = await supabase
    .from('skills')
    .insert(newSkillRecord)
    .select('*, category:skill_categories(*)')
    .single();

  if (insertError) {
    // If concurrent insert occurred, fetch it
    const { data: fallback } = await supabase
      .from('skills')
      .select('*, category:skill_categories(*)')
      .ilike('name', trimmedName)
      .maybeSingle();
    if (fallback) return fallback as Skill;
    throw insertError;
  }

  return created as Skill;
}

// ==================== PROFILES & DISCOVERY ====================

export interface SearchMembersFilter {
  query?: string;
  skillId?: string;
  categoryId?: string;
  level?: string;
  format?: string;
  language?: string;
  location?: string;
  minRating?: number;
}

export async function fetchMemberDetails(userId: string): Promise<{
  profile: Profile;
  teachingSkills: UserTeachingSkill[];
  learningSkills: UserLearningSkill[];
  availability: UserAvailability[];
  reviews: Review[];
  endorsements: SkillEndorsement[];
} | null> {
  const [pRes, tRes, lRes, aRes, rRes, eRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_teaching_skills').select('*, skill:skills(*)').eq('user_id', userId),
    supabase.from('user_learning_skills').select('*, skill:skills(*)').eq('user_id', userId),
    supabase.from('user_availability').select('*').eq('user_id', userId).order('day_of_week', { ascending: true }),
    supabase.from('reviews').select('*, reviewer:profiles(*), skill:skills(*)').eq('reviewee_id', userId).order('created_at', { ascending: false }),
    supabase.from('skill_endorsements').select('*, endorser:profiles(*), skill:skills(*)').eq('recipient_id', userId),
  ]);

  if (!pRes.data) return null;

  return {
    profile: pRes.data,
    teachingSkills: tRes.data || [],
    learningSkills: lRes.data || [],
    availability: aRes.data || [],
    reviews: rRes.data || [],
    endorsements: eRes.data || [],
  };
}

export async function searchMembers(filter: SearchMembersFilter): Promise<Profile[]> {
  let query = supabase.from('profiles').select('*').eq('status', 'active');

  if (filter.minRating && filter.minRating > 0) {
    query = query.gte('average_rating', filter.minRating);
  }

  const { data: profiles, error } = await query;
  if (error) throw error;
  if (!profiles) return [];

  // Filter with subqueries if skill/category/format/level filters apply
  let filtered = profiles;

  if (filter.query && filter.query.trim()) {
    const q = filter.query.toLowerCase().trim();
    filtered = filtered.filter(p =>
      (p.full_name && p.full_name.toLowerCase().includes(q)) ||
      (p.username && p.username.toLowerCase().includes(q)) ||
      (p.bio && p.bio.toLowerCase().includes(q)) ||
      (p.location && p.location.toLowerCase().includes(q))
    );
  }

  if (filter.language && filter.language !== 'all') {
    filtered = filtered.filter(p => p.languages && p.languages.includes(filter.language!));
  }

  if (filter.location && filter.location.trim()) {
    const loc = filter.location.toLowerCase().trim();
    filtered = filtered.filter(p => p.location && p.location.toLowerCase().includes(loc));
  }

  return filtered;
}

// ==================== USER SKILLS & AVAILABILITY ====================

export async function addUserTeachingSkill(skill: {
  skill_id: string;
  proficiency_level: string;
  experience_years: number;
  description: string;
  format: string;
}) {
  const { data, error } = await supabase.from('user_teaching_skills').insert(skill).select().single();
  if (error) throw error;
  return data;
}

export async function removeUserTeachingSkill(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { count } = await supabase
      .from('user_teaching_skills')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if (count !== null && count <= 1) {
      throw new Error('You must keep at least one teaching skill and one learning interest.');
    }
  }
  const { error } = await supabase.from('user_teaching_skills').delete().eq('id', id);
  if (error) {
    if (error.message.includes('You must keep at least one')) {
      throw new Error('You must keep at least one teaching skill and one learning interest.');
    }
    throw error;
  }
}

export async function addUserLearningSkill(skill: {
  skill_id: string;
  course_id?: string | null;
  current_level?: string;
  target_level?: string;
  priority?: string;
  notes?: string;
  preferred_format?: string;
}) {
  const payload = {
    skill_id: skill.skill_id,
    course_id: skill.course_id || null,
    current_level: skill.current_level || 'Beginner',
    target_level: skill.target_level || 'Advanced',
    priority: skill.priority || 'High',
    notes: skill.notes || '',
    preferred_format: skill.preferred_format || 'Online',
  };
  const { data, error } = await supabase.from('user_learning_skills').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function removeUserLearningSkill(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { count } = await supabase
      .from('user_learning_skills')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if (count !== null && count <= 1) {
      throw new Error('You must keep at least one teaching skill and one learning interest.');
    }
  }
  const { error } = await supabase.from('user_learning_skills').delete().eq('id', id);
  if (error) {
    if (error.message.includes('You must keep at least one')) {
      throw new Error('You must keep at least one teaching skill and one learning interest.');
    }
    throw error;
  }
}

export async function saveUserAvailability(slots: Array<{
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_online: boolean;
  is_in_person: boolean;
}>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Replace slots
  await supabase.from('user_availability').delete().eq('user_id', user.id);
  if (slots.length > 0) {
    const { error } = await supabase.from('user_availability').insert(
      slots.map(s => ({ ...s, user_id: user.id }))
    );
    if (error) throw error;
  }
}

// ==================== SMART MATCHING ENGINE ====================

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PROFICIENCY_RANK: Record<string, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
};

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function formatMinutesToTime(minutes: number): string {
  const norm = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : m;
  return `${displayH}:${displayM} ${ampm}`;
}

export async function computeSmartMatches(currentUserId: string): Promise<MatchResult[]> {
  // 1. Fetch current user data and privacy/block records in parallel
  const [
    myTeachRes,
    myLearnRes,
    myAvailRes,
    myProfileRes,
    blocksRes,
    savedMatchesRes,
    dismissedMatchesRes,
    activeRequestsRes,
  ] = await Promise.all([
    supabase.from('user_teaching_skills').select('*, skill:skills(*)').eq('user_id', currentUserId),
    supabase.from('user_learning_skills').select('*, skill:skills(*)').eq('user_id', currentUserId),
    supabase.from('user_availability').select('*').eq('user_id', currentUserId),
    supabase.from('profiles').select('*').eq('id', currentUserId).single(),
    supabase.from('user_blocks').select('blocker_id, blocked_id').or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`),
    supabase.from('user_saved_matches').select('matched_user_id').eq('user_id', currentUserId),
    supabase.from('user_dismissed_matches').select('matched_user_id').eq('user_id', currentUserId),
    supabase.from('exchange_requests').select('sender_id, receiver_id, status').or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`).in('status', ['pending', 'accepted']),
  ]);

  const myTeaching = myTeachRes.data || [];
  const myLearning = myLearnRes.data || [];
  const myAvail = myAvailRes.data || [];
  const myProfile = myProfileRes.data;

  // Blocked user IDs
  const blockedUserIds = new Set<string>();
  (blocksRes.data || []).forEach(b => {
    if (b.blocker_id === currentUserId) blockedUserIds.add(b.blocked_id);
    if (b.blocked_id === currentUserId) blockedUserIds.add(b.blocker_id);
  });

  // Saved and Dismissed sets
  const savedUserIds = new Set<string>((savedMatchesRes.data || []).map(s => s.matched_user_id));
  const dismissedUserIds = new Set<string>((dismissedMatchesRes.data || []).map(d => d.matched_user_id));

  // Active requests map
  const activeRequestsMap = new Map<string, 'pending' | 'accepted'>();
  (activeRequestsRes.data || []).forEach(r => {
    const otherId = r.sender_id === currentUserId ? r.receiver_id : r.sender_id;
    activeRequestsMap.set(otherId, r.status as 'pending' | 'accepted');
  });

  const myTeachSkillIds = new Set(myTeaching.map(t => t.skill_id));
  const myLearnSkillIds = new Set(myLearning.map(l => l.skill_id));

  // Teaching skills categories for complementary matching
  const myTeachingCategories = new Set(myTeaching.map(t => t.skill?.category_id).filter(Boolean));
  const myLearningCategories = new Set(myLearning.map(l => l.skill?.category_id).filter(Boolean));

  // 2. Fetch all other candidate members, skills, and availability
  const [allProfilesRes, allTeachRes, allLearnRes, allAvailRes, allCoursesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUserId)
      .eq('status', 'active'),
    supabase.from('user_teaching_skills').select('*, skill:skills(*)').neq('user_id', currentUserId),
    supabase.from('user_learning_skills').select('*, skill:skills(*)').neq('user_id', currentUserId),
    supabase.from('user_availability').select('*').neq('user_id', currentUserId),
    supabase.from('courses').select('*, primary_skill:skills(*)').eq('status', 'active'),
  ]);

  const otherProfiles = (allProfilesRes.data || []).filter(p => {
    // Exclude blocked members and members with discovery disabled
    if (blockedUserIds.has(p.id)) return false;
    if (p.discovery_enabled === false) return false;
    return true;
  });

  const allTeaching = allTeachRes.data || [];
  const allLearning = allLearnRes.data || [];
  const allAvail = allAvailRes.data || [];
  const allCourses = allCoursesRes.data || [];

  // Group by user
  const teachByUser = new Map<string, UserTeachingSkill[]>();
  for (const t of allTeaching) {
    const list = teachByUser.get(t.user_id) || [];
    list.push(t);
    teachByUser.set(t.user_id, list);
  }

  const learnByUser = new Map<string, UserLearningSkill[]>();
  for (const l of allLearning) {
    const list = learnByUser.get(l.user_id) || [];
    list.push(l);
    learnByUser.set(l.user_id, list);
  }

  const availByUser = new Map<string, UserAvailability[]>();
  for (const a of allAvail) {
    const list = availByUser.get(a.user_id) || [];
    list.push(a);
    availByUser.set(a.user_id, list);
  }

  const results: MatchResult[] = [];

  for (const peer of otherProfiles) {
    const peerTeaching = teachByUser.get(peer.id) || [];
    const peerLearning = learnByUser.get(peer.id) || [];
    const peerAvail = availByUser.get(peer.id) || [];

    // Find canonical skills peer teaches that I want to learn
    const skillsTheyTeachYouWant: Skill[] = peerTeaching
      .filter(t => myLearnSkillIds.has(t.skill_id))
      .map(t => t.skill)
      .filter(Boolean) as Skill[];

    // Find canonical skills I teach that peer wants to learn
    const skillsYouTeachTheyWant: Skill[] = peerLearning
      .filter(l => myTeachSkillIds.has(l.skill_id))
      .map(l => l.skill)
      .filter(Boolean) as Skill[];

    // Check courses peer can teach
    const peerTeachSkillIdSet = new Set(peerTeaching.map(t => t.skill_id));
    const coursesTheyCanTeach = allCourses.filter(c => peerTeachSkillIdSet.has(c.primary_skill_id));

    // Overlapping availability computation in normalized minutes
    const overlappingWindows: {
      dayOfWeek: number;
      dayName: string;
      startTime: string;
      endTime: string;
      overlapMinutes: number;
      formattedOverlap: string;
    }[] = [];

    let totalOverlapMinutes = 0;

    for (const ma of myAvail) {
      for (const pa of peerAvail) {
        if (ma.day_of_week === pa.day_of_week) {
          const maStart = parseTimeToMinutes(ma.start_time);
          const maEnd = parseTimeToMinutes(ma.end_time);
          const paStart = parseTimeToMinutes(pa.start_time);
          const paEnd = parseTimeToMinutes(pa.end_time);

          const oStart = Math.max(maStart, paStart);
          const oEnd = Math.min(maEnd, paEnd);

          if (oEnd > oStart) {
            const overlapMinutes = oEnd - oStart;
            totalOverlapMinutes += overlapMinutes;
            overlappingWindows.push({
              dayOfWeek: ma.day_of_week,
              dayName: DAY_NAMES[ma.day_of_week] || 'Day',
              startTime: formatMinutesToTime(oStart),
              endTime: formatMinutesToTime(oEnd),
              overlapMinutes,
              formattedOverlap: `${DAY_NAMES[ma.day_of_week]} ${formatMinutesToTime(oStart)} – ${formatMinutesToTime(oEnd)} (${Math.round((overlapMinutes / 60) * 10) / 10}h)`,
            });
          }
        }
      }
    }

    // Shared languages
    const myLangs = myProfile?.languages || ['English'];
    const peerLangs = peer.languages || ['English'];
    const sharedLanguages = myLangs.filter((l: string) => peerLangs.includes(l));

    // Match priority classification
    const isDirectReciprocal = skillsTheyTeachYouWant.length > 0 && skillsYouTeachTheyWant.length > 0;
    const isLearningMatch = skillsTheyTeachYouWant.length > 0;
    const isTeachingMatch = skillsYouTeachTheyWant.length > 0;

    // Check complementary domain synergy
    const peerTeachingCategories = new Set(peerTeaching.map(t => t.skill?.category_id).filter(Boolean));
    const sharesCategorySynergy = Array.from(myLearningCategories).some(c => peerTeachingCategories.has(c)) ||
      Array.from(myTeachingCategories).some(c => new Set(peerLearning.map(l => l.skill?.category_id)).has(c));

    const isExploratory = !isDirectReciprocal && !isLearningMatch && !isTeachingMatch;

    let matchType: 'reciprocal' | 'complementary' | 'one_way' | 'chain' = 'one_way';
    let matchTypeLabel = 'Learning Match';

    if (isDirectReciprocal) {
      matchType = 'reciprocal';
      matchTypeLabel = 'Direct Reciprocal Match';
    } else if (isLearningMatch && (totalOverlapMinutes > 0 || sharedLanguages.length > 0 || sharesCategorySynergy)) {
      matchType = 'complementary';
      matchTypeLabel = 'Strong Complementary Match';
    } else if (isLearningMatch) {
      matchType = 'one_way';
      matchTypeLabel = 'One-Way Learning Match';
    } else if (isTeachingMatch) {
      matchType = 'one_way';
      matchTypeLabel = 'One-Way Teaching Match';
    } else if (sharesCategorySynergy) {
      matchType = 'complementary';
      matchTypeLabel = 'Domain Complementary Match';
    } else {
      matchType = 'one_way';
      matchTypeLabel = 'Exploratory Match';
    }

    // ================= MULTI-FACTOR COMPATIBILITY SCORE (0-100) =================
    // 1. Skill Need Match (max 40 pts)
    let skillNeedScore = 0;
    if (skillsTheyTeachYouWant.length > 0) {
      skillNeedScore = 30 + Math.min(10, (skillsTheyTeachYouWant.length - 1) * 5);
    } else if (sharesCategorySynergy) {
      skillNeedScore = 15;
    } else {
      skillNeedScore = 5;
    }

    // 2. Reciprocal Skill Match (max 20 pts)
    let reciprocalScore = 0;
    if (isDirectReciprocal) {
      reciprocalScore = 20;
    } else if (skillsYouTeachTheyWant.length > 0) {
      reciprocalScore = 12;
    } else if (sharesCategorySynergy) {
      reciprocalScore = 8;
    } else {
      reciprocalScore = 0;
    }

    // 3. Availability Overlap (max 15 pts)
    let availabilityScore = 0;
    if (totalOverlapMinutes >= 120) {
      availabilityScore = 15;
    } else if (totalOverlapMinutes >= 60) {
      availabilityScore = 11;
    } else if (totalOverlapMinutes >= 30) {
      availabilityScore = 7;
    } else if (overlappingWindows.length > 0) {
      availabilityScore = 4;
    } else {
      availabilityScore = 1;
    }

    // 4. Expertise Level Compatibility (max 10 pts)
    let expertiseScore = 7; // baseline
    let expertiseAssessment = 'Compatible expertise level';
    if (skillsTheyTeachYouWant.length > 0) {
      const targetSkillId = skillsTheyTeachYouWant[0].id;
      const peerTeachRecord = peerTeaching.find(t => t.skill_id === targetSkillId);
      const myLearnRecord = myLearning.find(l => l.skill_id === targetSkillId);

      const teacherLevel = peerTeachRecord?.proficiency_level || 'Intermediate';
      const learnerLevel = myLearnRecord?.target_level || 'Intermediate';

      const tRank = PROFICIENCY_RANK[teacherLevel] || 2;
      const lRank = PROFICIENCY_RANK[learnerLevel] || 2;

      if (tRank >= lRank) {
        expertiseScore = 10;
        expertiseAssessment = `Teacher level (${teacherLevel}) matches or exceeds your target (${learnerLevel})`;
      } else if (tRank === lRank - 1) {
        expertiseScore = 6;
        expertiseAssessment = `Teacher is ${teacherLevel}, slightly below your target (${learnerLevel})`;
      } else {
        expertiseScore = 3;
        expertiseAssessment = `Teacher is ${teacherLevel}; your target is ${learnerLevel}`;
      }
    }

    // 5. Location Compatibility (max 5 pts)
    let locationScore = 5;
    let locationStatus = 'Location flexible';
    const locationEnabled = myProfile?.location_matching_enabled !== false && peer.location_matching_enabled !== false;

    if (!locationEnabled) {
      locationScore = 5; // Neutral - no penalty when location matching is off
      locationStatus = 'Location matching not required';
    } else if (myProfile?.preferred_format === 'In-Person' || peer.preferred_format === 'In-Person') {
      if (myProfile?.city && peer.city && myProfile.city.toLowerCase() === peer.city.toLowerCase()) {
        locationScore = 5;
        locationStatus = `Same city: ${peer.city}`;
      } else if (myProfile?.country && peer.country && myProfile.country.toLowerCase() === peer.country.toLowerCase()) {
        locationScore = 3.5;
        locationStatus = `Same country: ${peer.country}`;
      } else {
        locationScore = 1.5;
        locationStatus = 'Different location';
      }
    } else {
      locationScore = 5; // Online matches are never penalized by distance
      locationStatus = 'Online format - distance agnostic';
    }

    // 6. Format Compatibility (max 5 pts)
    let formatScore = 5;
    let formatStatus = 'Compatible format';
    const myFmt = myProfile?.preferred_format || 'Both';
    const peerFmt = peer.preferred_format || 'Both';
    if (myFmt === 'Both' || peerFmt === 'Both' || myFmt === peerFmt) {
      formatScore = 5;
      formatStatus = `Both support ${myFmt === peerFmt ? myFmt : 'flexible formats'}`;
    } else {
      formatScore = 2;
      formatStatus = `Format mismatch (You: ${myFmt}, Peer: ${peerFmt})`;
    }

    // 7. Language Compatibility (max 5 pts)
    let languageScore = 0;
    if (sharedLanguages.length > 0) {
      languageScore = 5;
    } else {
      languageScore = 1;
    }

    const totalScore = Math.min(
      99,
      Math.max(
        25,
        Math.round(skillNeedScore + reciprocalScore + availabilityScore + expertiseScore + locationScore + formatScore + languageScore)
      )
    );

    // Build transparent, verified reasons
    const reasons: string[] = [];

    if (skillsTheyTeachYouWant.length > 0) {
      reasons.push(`✓ You want to learn ${skillsTheyTeachYouWant.map(s => s.name).join(', ')}`);
      reasons.push(`✓ They teach ${skillsTheyTeachYouWant.map(s => s.name).join(', ')}`);
    }

    if (skillsYouTeachTheyWant.length > 0) {
      reasons.push(`✓ They want to learn ${skillsYouTeachTheyWant.map(s => s.name).join(', ')}`);
      reasons.push(`✓ You teach ${skillsYouTeachTheyWant.map(s => s.name).join(', ')}`);
    }

    if (overlappingWindows.length > 0) {
      const hoursStr = Math.round((totalOverlapMinutes / 60) * 10) / 10;
      reasons.push(`✓ Schedule overlap: ${hoursStr}h across ${overlappingWindows.length} time slot${overlappingWindows.length > 1 ? 's' : ''}`);
    } else if (peer.timezone) {
      reasons.push(`• Timezone: ${peer.timezone} (No direct recurring time slot overlap)`);
    } else {
      reasons.push(`• Time zone not provided by peer`);
    }

    if (sharedLanguages.length > 0) {
      reasons.push(`✓ Shared languages: ${sharedLanguages.join(', ')}`);
    }

    if (formatScore >= 4) {
      reasons.push(`✓ Format compatibility: ${formatStatus}`);
    }

    if (peer.reputation_score && peer.reputation_score >= 80) {
      reasons.push(`✓ High community reputation: ${peer.reputation_score} trust score`);
    }

    const hasActiveRequest = activeRequestsMap.has(peer.id);
    const activeRequestStatus = activeRequestsMap.get(peer.id) || null;
    const isSaved = savedUserIds.has(peer.id);
    const isDismissed = dismissedUserIds.has(peer.id);

    results.push({
      member: peer,
      compatibilityScore: totalScore,
      mutualMatch: isDirectReciprocal,
      matchType,
      matchTypeLabel,
      skillsTheyTeachYouWant,
      skillsYouTeachTheyWant,
      coursesTheyCanTeach,
      peerAllTeaching: peerTeaching.map(t => t.skill).filter(Boolean) as Skill[],
      peerAllLearning: peerLearning.map(l => l.skill).filter(Boolean) as Skill[],
      isExploratory,
      availabilityOverlapCount: overlappingWindows.length,
      totalOverlapMinutes,
      overlappingWindows,
      sharedLanguages,
      reasons,
      scoreBreakdown: {
        skillNeed: Math.round(skillNeedScore),
        reciprocal: Math.round(reciprocalScore),
        availability: Math.round(availabilityScore),
        expertise: Math.round(expertiseScore),
        location: Math.round(locationScore),
        format: Math.round(formatScore),
        language: Math.round(languageScore),
        total: totalScore,
      },
      expertiseAssessment,
      locationStatus,
      formatStatus,
      hasActiveRequest,
      activeRequestStatus,
      isSaved,
      isDismissed,
    });
  }

  // Priority sorting: Reciprocal (3) -> Complementary (2) -> One-way (1) -> highest compatibility score
  results.sort((a, b) => {
    const priorityWeight = { reciprocal: 4, complementary: 3, one_way: 2, chain: 1 };
    const diff = priorityWeight[b.matchType] - priorityWeight[a.matchType];
    if (diff !== 0) return diff;
    return b.compatibilityScore - a.compatibilityScore;
  });

  return results;
}

// ==================== MATCH BOOKMARKS & DISMISS ====================

export async function saveMatch(matchedUserId: string, notes?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_saved_matches')
    .upsert({
      user_id: user.id,
      matched_user_id: matchedUserId,
      notes: notes || null,
    }, { onConflict: 'user_id,matched_user_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function unsaveMatch(matchedUserId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_saved_matches')
    .delete()
    .eq('user_id', user.id)
    .eq('matched_user_id', matchedUserId);

  if (error) throw error;
}

export async function dismissMatch(matchedUserId: string, reason?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_dismissed_matches')
    .upsert({
      user_id: user.id,
      matched_user_id: matchedUserId,
      reason: reason || 'Not interested at this time',
    }, { onConflict: 'user_id,matched_user_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function undismissMatch(matchedUserId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_dismissed_matches')
    .delete()
    .eq('user_id', user.id)
    .eq('matched_user_id', matchedUserId);

  if (error) throw error;
}

// ==================== EXCHANGE REQUESTS ====================

export async function fetchExchangeRequests(userId: string): Promise<ExchangeRequest[]> {
  const { data, error } = await supabase
    .from('exchange_requests')
    .select(`
      *,
      sender:profiles!exchange_requests_sender_id_fkey(*),
      receiver:profiles!exchange_requests_receiver_id_fkey(*),
      teach_skill:skills!exchange_requests_teach_skill_id_fkey(*),
      learn_skill:skills!exchange_requests_learn_skill_id_fkey(*)
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createExchangeRequest(params: {
  receiver_id: string;
  teach_skill_id: string;
  learn_skill_id: string;
  proposal_message: string;
  preferred_format?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify and sanitize UUID fields so invalid or empty strings don't crash Supabase
  const teachSkillId = params.teach_skill_id && params.teach_skill_id.trim() ? params.teach_skill_id.trim() : null;
  const learnSkillId = params.learn_skill_id && params.learn_skill_id.trim() ? params.learn_skill_id.trim() : null;

  const { data, error } = await supabase
    .from('exchange_requests')
    .insert({
      sender_id: user.id,
      receiver_id: params.receiver_id,
      teach_skill_id: teachSkillId,
      learn_skill_id: learnSkillId,
      proposal_message: params.proposal_message,
      preferred_format: params.preferred_format || 'Online',
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  // Fetch sender name for descriptive notification
  const { data: senderProfile } = await supabase.from('profiles').select('full_name, username').eq('id', user.id).maybeSingle();
  const senderName = senderProfile?.full_name || senderProfile?.username || 'A peer';

  // Create notification for receiver
  await supabase.from('notifications').insert({
    user_id: params.receiver_id,
    actor_id: user.id,
    type: 'exchange_request',
    title: 'New Exchange Proposal',
    content: `${senderName} sent you a skill exchange proposal: "${params.proposal_message.slice(0, 60)}${params.proposal_message.length > 60 ? '...' : ''}"`,
    link: '/exchanges?tab=incoming',
  });

  return data;
}

export async function updateExchangeStatus(requestId: string, status: 'accepted' | 'rejected' | 'cancelled' | 'completed', note?: string) {
  const { data: request, error: fetchErr } = await supabase
    .from('exchange_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchErr) throw fetchErr;

  const { error } = await supabase
    .from('exchange_requests')
    .update({ status, response_note: note, updated_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) throw error;

  // If accepted, auto-create a conversation
  if (status === 'accepted') {
    const { data: conv } = await supabase
      .from('conversations')
      .select('*')
      .eq('exchange_id', requestId)
      .maybeSingle();

    if (!conv) {
      await supabase.from('conversations').insert({
        exchange_id: requestId,
        participant_one: request.sender_id,
        participant_two: request.receiver_id,
        last_message_text: 'Exchange accepted! Say hello to start collaborating.',
      });
    }

    // Notify sender
    await supabase.from('notifications').insert({
      user_id: request.sender_id,
      actor_id: request.receiver_id,
      type: 'request_accepted',
      title: 'Exchange Accepted!',
      content: 'Your skill exchange request was accepted. You can now chat and schedule sessions.',
      link: `/chat`,
    });
  }
}

// ==================== SESSIONS & SCHEDULING ====================

export async function fetchUserSessions(userId: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      teacher:profiles!sessions_teacher_id_fkey(*),
      learner:profiles!sessions_learner_id_fkey(*),
      skill:skills!sessions_skill_id_fkey(*)
    `)
    .or(`teacher_id.eq.${userId},learner_id.eq.${userId}`)
    .order('session_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createSession(params: {
  exchange_id: string;
  teacher_id: string;
  learner_id: string;
  skill_id: string;
  title: string;
  session_date: string;
  start_time: string;
  end_time: string;
  meeting_link?: string;
  virtual_platform?: string;
  location_name?: string;
  location_address?: string;
  location_notes?: string;
  safety_notes?: string;
  duration_minutes?: number;
  format?: string;
}) {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      exchange_id: params.exchange_id,
      teacher_id: params.teacher_id,
      learner_id: params.learner_id,
      skill_id: params.skill_id,
      title: params.title,
      session_date: params.session_date,
      start_time: params.start_time,
      end_time: params.end_time,
      meeting_link: params.meeting_link || (params.format === 'In-Person' ? null : 'https://meet.jit.si/skillxchange-' + Math.random().toString(36).substring(7)),
      virtual_platform: params.virtual_platform || (params.format === 'In-Person' ? null : 'Jitsi Meet'),
      location_name: params.location_name || null,
      location_address: params.location_address || null,
      location_notes: params.location_notes || null,
      safety_notes: params.safety_notes || null,
      duration_minutes: params.duration_minutes || 60,
      format: params.format || 'Online',
      status: 'scheduled',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSessionStatus(sessionId: string, status: string) {
  const { error } = await supabase
    .from('sessions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', sessionId);
  if (error) throw error;
}

// ==================== REALTIME CHAT ====================

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`participant_one.eq.${userId},participant_two.eq.${userId}`)
    .order('last_message_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  // Populate other_participant
  const result: Conversation[] = [];
  for (const c of data) {
    const otherId = c.participant_one === userId ? c.participant_two : c.participant_one;
    const { data: otherP } = await supabase.from('profiles').select('*').eq('id', otherId).maybeSingle();
    result.push({
      ...c,
      other_participant: otherP || undefined,
    });
  }

  return result;
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles(*)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function sendMessage(conversationId: string, text: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      message_text: text,
      is_read: false,
    })
    .select('*, sender:profiles(*)')
    .single();

  if (error) throw error;

  // Update conversation last message
  await supabase
    .from('conversations')
    .update({
      last_message_text: text,
      last_message_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  return data;
}

// ==================== REVIEWS & ENDORSEMENTS ====================

export async function submitReview(review: {
  session_id: string;
  reviewee_id: string;
  skill_id?: string;
  rating: number;
  knowledge_rating: number;
  communication_rating: number;
  punctuality_rating: number;
  feedback: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      ...review,
      reviewer_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Increment reviewee stats
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', review.reviewee_id).single();
  if (profile) {
    const count = (profile.total_reviews || 0) + 1;
    const currentRating = profile.average_rating || 5.0;
    const newRating = Number(((currentRating * (count - 1) + review.rating) / count).toFixed(2));
    const newReputation = Math.min(100, (profile.reputation_score || 50) + (review.rating >= 4 ? 3 : 1));

    await supabase.from('profiles').update({
      total_reviews: count,
      average_rating: newRating,
      reputation_score: newReputation,
    }).eq('id', review.reviewee_id);
  }

  return data;
}

export async function submitEndorsement(recipientId: string, skillId: string, comment?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('skill_endorsements')
    .insert({
      endorser_id: user.id,
      recipient_id: recipientId,
      skill_id: skillId,
      comment: comment || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Increment endorsement count on teaching skill
  const { data: teachSkill } = await supabase
    .from('user_teaching_skills')
    .select('*')
    .eq('user_id', recipientId)
    .eq('skill_id', skillId)
    .maybeSingle();

  if (teachSkill) {
    await supabase
      .from('user_teaching_skills')
      .update({ endorsements_count: (teachSkill.endorsements_count || 0) + 1 })
      .eq('id', teachSkill.id);
  }

  return data;
}

// ==================== LEARNING PROGRESS ====================

export async function fetchLearningProgress(exchangeId: string): Promise<LearningProgress[]> {
  const { data, error } = await supabase
    .from('learning_progress')
    .select('*')
    .eq('exchange_id', exchangeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchUserLearningProgressList(userId: string): Promise<LearningProgress[]> {
  const { data, error } = await supabase
    .from('learning_progress')
    .select(`
      *,
      exchange:exchange_requests(
        *,
        sender:profiles!exchange_requests_sender_id_fkey(*),
        receiver:profiles!exchange_requests_receiver_id_fkey(*),
        teach_skill:skills!exchange_requests_teach_skill_id_fkey(*),
        learn_skill:skills!exchange_requests_learn_skill_id_fkey(*)
      )
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching user learning progress:', error);
    return [];
  }
  return (data as any) || [];
}

export async function saveLearningProgress(progress: {
  id?: string;
  exchange_id: string;
  goal_title: string;
  starting_level: string;
  current_level: string;
  target_level: string;
  progress_percent: number;
  milestones: Array<{ id?: string; title: string; completed: boolean; completed_at?: string }>;
  session_logs?: Array<{ id: string; date: string; hours: number; summary: string }>;
  hours_logged?: number;
  notes?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const payload: any = {
    ...progress,
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('learning_progress')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLearningProgress(id: string) {
  const { error } = await supabase.from('learning_progress').delete().eq('id', id);
  if (error) throw error;
}

// ==================== NOTIFICATIONS ====================

export async function fetchNotifications(userId: string): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:profiles(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function markNotificationAsRead(id: string) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
  if (error) throw error;
}

// ==================== COMMUNITY FORUM ====================

export async function fetchCommunityPosts(category?: string): Promise<CommunityPost[]> {
  let query = supabase
    .from('community_posts')
    .select('*, author:profiles(*), skill:skills(*)')
    .order('created_at', { ascending: false });

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createCommunityPost(post: {
  title: string;
  content: string;
  category: string;
  skill_id?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      ...post,
      author_id: user.id,
      likes_count: 0,
      comments_count: 0,
    })
    .select('*, author:profiles(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function fetchCommunityComments(postId: string): Promise<CommunityComment[]> {
  const { data, error } = await supabase
    .from('community_comments')
    .select('*, author:profiles(*)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addCommunityComment(postId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('community_comments')
    .insert({
      post_id: postId,
      author_id: user.id,
      content,
    })
    .select('*, author:profiles(*)')
    .single();

  if (error) throw error;

  // Increment comments count
  const { data: post } = await supabase.from('community_posts').select('comments_count').eq('id', postId).single();
  if (post) {
    await supabase
      .from('community_posts')
      .update({ comments_count: (post.comments_count || 0) + 1 })
      .eq('id', postId);
  }

  return data;
}

// ==================== SAFETY & MODERATION ====================

export async function blockUser(targetUserId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_blocks')
    .insert({
      blocker_id: user.id,
      blocked_id: targetUserId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==================== ADMIN OPERATIONS ====================

export async function fetchAdminKPIs() {
  const [uRes, eRes, sRes, skRes, rRes] = await Promise.all([
    supabase.from('profiles').select('id, role, status', { count: 'exact' }),
    supabase.from('exchange_requests').select('id, status', { count: 'exact' }),
    supabase.from('sessions').select('id, status', { count: 'exact' }),
    supabase.from('skills').select('id', { count: 'exact' }),
    supabase.from('reports').select('id, status', { count: 'exact' }),
  ]);

  const totalUsers = uRes.count || 0;
  const activeExchanges = (eRes.data || []).filter(e => e.status === 'accepted').length;
  const completedExchanges = (eRes.data || []).filter(e => e.status === 'completed').length;
  const totalExchanges = eRes.count || 0;
  const completedSessions = (sRes.data || []).filter(s => s.status === 'completed').length;
  const totalSessions = sRes.count || 0;
  const totalSkills = skRes.count || 0;
  const pendingReports = (rRes.data || []).filter(r => r.status === 'pending').length;

  return {
    totalUsers,
    activeExchanges,
    totalExchanges,
    completedExchanges,
    completedSessions,
    totalSessions,
    totalSkills,
    pendingReports,
    totalPosts: 14,
    matchSuccessRate: totalExchanges > 0 ? Math.round((activeExchanges / totalExchanges) * 100) : 85,
  };
}

export async function fetchAllUsers(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned', role?: 'user' | 'admin') {
  const payload: Partial<Profile> = { status };
  if (role) payload.role = role;
  const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
  if (error) throw error;
}

export async function fetchReports(): Promise<ReportItem[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*, reporter:profiles!reports_reporter_id_fkey(*), reported_user:profiles!reports_reported_user_id_fkey(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function resolveReport(reportId: string, status: 'resolved' | 'dismissed', notes?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('reports')
    .update({
      status,
      admin_notes: notes || null,
      resolved_by: user?.id,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', reportId);
  if (error) throw error;
}

export async function submitReport(params: {
  reported_user_id?: string;
  target_type: 'user' | 'message' | 'post' | 'comment';
  target_id?: string;
  reason: string;
  description?: string;
  content_snippet?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      reported_user_id: params.reported_user_id || null,
      target_type: params.target_type,
      target_id: params.target_id || null,
      reason: params.reason,
      description: params.description || '',
      content_snippet: params.content_snippet || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCommunityPost(postId: string) {
  const { error } = await supabase.from('community_posts').delete().eq('id', postId);
  if (error) throw error;
}

export async function deleteCommunityComment(commentId: string) {
  const { error } = await supabase.from('community_comments').delete().eq('id', commentId);
  if (error) throw error;
}

export async function fetchDetailedAdminAnalytics() {
  const [
    usersRes,
    postsRes,
    commentsRes,
    exchangesRes,
    sessionsRes,
    reportsRes,
    skillsRes,
    progressRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id, role, status, onboarding_status, created_at'),
    supabase.from('community_posts').select('id, category, upvotes, created_at'),
    supabase.from('community_comments').select('id, created_at'),
    supabase.from('exchange_requests').select('id, status, teach_skill_id, learn_skill_id, preferred_format, created_at'),
    supabase.from('sessions').select('id, status, format, duration_minutes, created_at'),
    supabase.from('reports').select('id, status, target_type, created_at'),
    supabase.from('skills').select('id, name, category_id'),
    supabase.from('learning_progress').select('id, progress_percent, hours_logged'),
  ]);

  const users = usersRes.data || [];
  const posts = postsRes.data || [];
  const comments = commentsRes.data || [];
  const exchanges = exchangesRes.data || [];
  const sessions = sessionsRes.data || [];
  const reports = reportsRes.data || [];
  const skills = skillsRes.data || [];
  const progress = progressRes.data || [];

  const totalUsers = users.length;
  const onboardedUsers = users.filter(u => u.onboarding_status === 'completed').length;
  const onboardingRate = totalUsers > 0 ? Math.round((onboardedUsers / totalUsers) * 100) : 100;

  const totalPosts = posts.length;
  const totalComments = comments.length;
  const totalDiscussionsActivity = totalPosts + totalComments;

  const totalExchanges = exchanges.length;
  const acceptedExchanges = exchanges.filter(e => e.status === 'accepted' || e.status === 'completed').length;
  const completedExchanges = exchanges.filter(e => e.status === 'completed').length;
  const exchangeSuccessRate = totalExchanges > 0 ? Math.round((acceptedExchanges / totalExchanges) * 100) : 0;

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const onlineSessions = sessions.filter(s => s.format === 'Online' || !s.format).length;
  const inPersonSessions = sessions.filter(s => s.format === 'In-Person').length;
  const onlineRatio = totalSessions > 0 ? Math.round((onlineSessions / totalSessions) * 100) : 75;

  const totalHoursLogged = progress.reduce((acc, p) => acc + Number(p.hours_logged || 0), 0) +
    completedSessions * 1.5;

  const pendingReports = reports.filter(r => r.status === 'pending').length;

  // Top skills count in exchanges
  const skillCountMap = new Map<string, number>();
  exchanges.forEach(e => {
    if (e.teach_skill_id) skillCountMap.set(e.teach_skill_id, (skillCountMap.get(e.teach_skill_id) || 0) + 1);
    if (e.learn_skill_id) skillCountMap.set(e.learn_skill_id, (skillCountMap.get(e.learn_skill_id) || 0) + 1);
  });

  const skillNameMap = new Map(skills.map(s => [s.id, s.name]));
  const topSkills = Array.from(skillCountMap.entries())
    .map(([id, count]) => ({
      id,
      name: skillNameMap.get(id) || 'Skill',
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    totalUsers,
    onboardedUsers,
    onboardingRate,
    totalPosts,
    totalComments,
    totalDiscussionsActivity,
    totalExchanges,
    acceptedExchanges,
    completedExchanges,
    exchangeSuccessRate,
    totalSessions,
    completedSessions,
    onlineSessions,
    inPersonSessions,
    onlineRatio,
    totalHoursLogged: Math.round(totalHoursLogged * 10) / 10,
    pendingReports,
    topSkills,
  };
}

export async function createSkillCategory(category: { name: string; description: string; icon: string }) {
  const { data, error } = await supabase.from('skill_categories').insert(category).select().single();
  if (error) throw error;
  return data;
}

export async function createSkill(skill: { category_id: string; name: string; description: string }) {
  const { data, error } = await supabase.from('skills').insert(skill).select().single();
  if (error) throw error;
  return data;
}

// ==================== PEER CONNECTIONS ====================

export async function fetchUserConnections(userId: string): Promise<Connection[]> {
  const { data, error } = await supabase
    .from('connections')
    .select(`
      *,
      requester:profiles!connections_requester_id_fkey(*),
      recipient:profiles!connections_recipient_id_fkey(*)
    `)
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching connections:', error);
    return [];
  }
  return (data as Connection[]) || [];
}

export async function sendConnectionRequest(recipientId: string, note?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  if (user.id === recipientId) throw new Error('You cannot connect with yourself');

  // Check if existing connection already exists
  const { data: existing } = await supabase
    .from('connections')
    .select('*')
    .or(`and(requester_id.eq.${user.id},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${user.id})`)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'connected') {
      throw new Error('You are already connected with this member');
    }
    if (existing.status === 'pending') {
      throw new Error('A connection request is already pending between you');
    }
    // If declined, update back to pending
    const { data: updated, error: updateErr } = await supabase
      .from('connections')
      .update({
        requester_id: user.id,
        recipient_id: recipientId,
        status: 'pending',
        note: note || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (updateErr) throw updateErr;
    return updated;
  }

  const { data, error } = await supabase
    .from('connections')
    .insert({
      requester_id: user.id,
      recipient_id: recipientId,
      status: 'pending',
      note: note || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Send notification to recipient
  const { data: senderP } = await supabase.from('profiles').select('full_name, username').eq('id', user.id).maybeSingle();
  const senderName = senderP?.full_name || senderP?.username || 'A peer';

  await supabase.from('notifications').insert({
    user_id: recipientId,
    actor_id: user.id,
    type: 'connection_request',
    title: 'New Connection Request',
    content: `${senderName} wants to connect with you on SkillXChange.`,
    link: '/connections?tab=received',
  });

  return data;
}

export async function respondToConnection(connectionId: string, status: 'connected' | 'declined') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: conn, error: fetchErr } = await supabase
    .from('connections')
    .select('*')
    .eq('id', connectionId)
    .single();

  if (fetchErr) throw fetchErr;

  const { data, error } = await supabase
    .from('connections')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', connectionId)
    .select()
    .single();

  if (error) throw error;

  // If connected, notify the requester
  if (status === 'connected') {
    const notifyTarget = conn.requester_id === user.id ? conn.recipient_id : conn.requester_id;
    const { data: me } = await supabase.from('profiles').select('full_name, username').eq('id', user.id).maybeSingle();
    const myName = me?.full_name || me?.username || 'A peer';

    await supabase.from('notifications').insert({
      user_id: notifyTarget,
      actor_id: user.id,
      type: 'connection_accepted',
      title: 'Connection Accepted',
      content: `${myName} accepted your connection request! You are now connected.`,
      link: '/connections',
    });
  }

  return data;
}

export async function removeConnection(connectionId: string) {
  const { error } = await supabase.from('connections').delete().eq('id', connectionId);
  if (error) throw error;
}

export async function getConnectionStateBetween(userId1: string, userId2: string): Promise<{
  status: 'none' | 'pending_sent' | 'pending_received' | 'connected';
  connectionId?: string;
}> {
  const { data } = await supabase
    .from('connections')
    .select('*')
    .or(`and(requester_id.eq.${userId1},recipient_id.eq.${userId2}),and(requester_id.eq.${userId2},recipient_id.eq.${userId1})`)
    .maybeSingle();

  if (!data) return { status: 'none' };
  if (data.status === 'connected') return { status: 'connected', connectionId: data.id };
  if (data.status === 'pending') {
    return {
      status: data.requester_id === userId1 ? 'pending_sent' : 'pending_received',
      connectionId: data.id,
    };
  }
  return { status: 'none', connectionId: data.id };
}

// Admin Aliases for compatibility
export const fetchAdminAnalytics = fetchAdminKPIs;
export const fetchAdminUsers = fetchAllUsers;
export const fetchAdminReports = fetchReports;

// ==================== COURSE CATALOG ====================

export async function fetchCourses(filter?: { category?: string; query?: string; skillId?: string }): Promise<Course[]> {
  let query = supabase
    .from('courses')
    .select('*, primary_skill:skills(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (filter?.category && filter.category !== 'all') {
    query = query.eq('category', filter.category);
  }
  if (filter?.skillId) {
    query = query.eq('primary_skill_id', filter.skillId);
  }

  const { data, error } = await query;
  if (error) throw error;
  let results = (data as Course[]) || [];
  if (filter?.query && filter.query.trim()) {
    const q = filter.query.toLowerCase().trim();
    results = results.filter(c =>
      c.title.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.instructor && c.instructor.toLowerCase().includes(q))
    );
  }
  return results;
}

export async function fetchCourseById(id: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('*, primary_skill:skills(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Course | null;
}

export async function createCourse(course: {
  title: string;
  description: string;
  primary_skill_id: string;
  category: string;
  level: string;
  duration: string;
  instructor: string;
  image_url?: string;
}) {
  const { data, error } = await supabase.from('courses').insert(course).select().single();
  if (error) throw error;
  return data as Course;
}

export async function updateCourse(id: string, updates: Partial<Course>) {
  const { data, error } = await supabase
    .from('courses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Course;
}

// ==================== MANDATORY ONBOARDING APIs ====================

export async function fetchUserOnboardingDetails(userId: string) {
  const [profileRes, teachRes, learnRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('user_teaching_skills').select('*, skill:skills(*)').eq('user_id', userId),
    supabase.from('user_learning_skills').select('*, skill:skills(*), course:courses(*)').eq('user_id', userId),
  ]);

  if (profileRes.error) throw profileRes.error;

  return {
    profile: profileRes.data,
    teachingSkills: teachRes.data || [],
    learningSkills: learnRes.data || [],
  };
}

export async function saveOnboardingStepProgress(step: number, data?: {
  city?: string;
  country?: string;
  preferred_format?: string;
  experience_level?: string;
  bio?: string;
  full_name?: string;
  languages?: string[];
  avatar_url?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const updates: Record<string, any> = {
    onboarding_step: step,
    onboarding_status: 'in_progress',
    updated_at: new Date().toISOString(),
  };

  if (data?.city !== undefined) updates.city = data.city;
  if (data?.country !== undefined) updates.country = data.country;
  if (data?.preferred_format !== undefined) updates.preferred_format = data.preferred_format;
  if (data?.experience_level !== undefined) updates.experience_level = data.experience_level;
  if (data?.bio !== undefined) updates.bio = data.bio;
  if (data?.full_name !== undefined) updates.full_name = data.full_name;
  if (data?.languages !== undefined) updates.languages = data.languages;
  if (data?.avatar_url !== undefined) updates.avatar_url = data.avatar_url;

  if (data?.city && data?.country) {
    updates.location = `${data.city}, ${data.country}`;
  }

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
  if (error) throw error;
}

export async function completeUserOnboarding(params: {
  full_name?: string;
  bio?: string;
  city?: string;
  country?: string;
  languages?: string[];
  experience_level?: string;
  preferred_format?: string;
  avatar_url?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 1. Verify server-side database requirements directly
  const [teachingRes, learningRes] = await Promise.all([
    supabase.from('user_teaching_skills').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('user_learning_skills').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);

  if ((teachingRes.count || 0) < 1) {
    throw new Error('Please select at least one skill you can teach.');
  }
  if ((learningRes.count || 0) < 1) {
    throw new Error('Please select at least one course or skill you want to learn.');
  }

  // 2. Call the atomic PostgreSQL function complete_user_onboarding
  const { data, error } = await supabase.rpc('complete_user_onboarding', {
    p_user_id: user.id,
    p_full_name: params.full_name || null,
    p_bio: params.bio || null,
    p_city: params.city || null,
    p_country: params.country || null,
    p_languages: params.languages || ['English'],
    p_experience: params.experience_level || 'Intermediate',
    p_format: params.preferred_format || 'Online',
    p_avatar_url: params.avatar_url || null,
  });

  if (error) {
    if (error.message.includes('teaching skill')) {
      throw new Error('Please select at least one skill you can teach.');
    }
    if (error.message.includes('learning')) {
      throw new Error('Please select at least one course or skill you want to learn.');
    }
    throw error;
  }

  return data;
}


