export type UserRole = 'admin' | 'user' | 'moderator';

export interface Profile {
  id: string;
  username: string | null;
  email: string | null;
  role: UserRole;
  permissions?: string[];
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  location?: string | null;
  city?: string | null;
  country?: string | null;
  languages?: string[];
  timezone?: string;
  reputation_score?: number;
  status?: 'active' | 'suspended' | 'banned';
  onboarding_status?: 'not_started' | 'in_progress' | 'completed';
  onboarding_step?: number;
  preferred_format?: 'Online' | 'In-Person' | 'Both';
  experience_level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  discovery_enabled?: boolean;
  location_matching_enabled?: boolean;
  state_region?: string | null;
  completed_exchanges?: number;
  completed_sessions?: number;
  average_rating?: number;
  total_reviews?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  display_order: number;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface Skill {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  created_at?: string;
  category?: SkillCategory;
}

export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type TeachingFormat = 'Online' | 'In-Person' | 'Both';

export interface UserTeachingSkill {
  id: string;
  user_id: string;
  skill_id: string;
  proficiency_level: ProficiencyLevel;
  experience_years: number;
  description: string | null;
  format: TeachingFormat;
  endorsements_count: number;
  created_at?: string;
  skill?: Skill;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  primary_skill_id: string | null;
  category: string;
  level: string;
  language: string;
  duration: string | null;
  instructor: string | null;
  status: 'active' | 'inactive';
  image_url: string | null;
  created_at?: string;
  updated_at?: string;
  primary_skill?: Skill;
}

export interface UserLearningSkill {
  id: string;
  user_id: string;
  skill_id: string;
  course_id?: string | null;
  current_level: ProficiencyLevel;
  target_level: ProficiencyLevel;
  priority: 'High' | 'Medium' | 'Low';
  notes: string | null;
  preferred_format: TeachingFormat;
  created_at?: string;
  skill?: Skill;
  course?: Course;
}

export interface UserAvailability {
  id: string;
  user_id: string;
  day_of_week: number; // 0=Sunday, 1=Monday ... 6=Saturday
  start_time: string; // "09:00"
  end_time: string; // "12:00"
  is_online: boolean;
  is_in_person: boolean;
  created_at?: string;
}

export type ExchangeStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

export interface ExchangeRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  teach_skill_id: string | null;
  learn_skill_id: string | null;
  proposal_message: string;
  preferred_format: TeachingFormat;
  status: ExchangeStatus;
  response_note: string | null;
  created_at: string;
  updated_at: string;
  sender?: Profile;
  receiver?: Profile;
  teach_skill?: Skill;
  learn_skill?: Skill;
}

export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';

export interface Session {
  id: string;
  exchange_id: string;
  teacher_id: string;
  learner_id: string;
  skill_id: string | null;
  title: string;
  session_date: string;
  start_time: string;
  end_time: string;
  meeting_link: string | null;
  virtual_platform?: string | null;
  location_name?: string | null;
  location_address?: string | null;
  location_notes: string | null;
  safety_notes?: string | null;
  duration_minutes?: number;
  format: TeachingFormat;
  status: SessionStatus;
  teacher_confirmed: boolean;
  learner_confirmed: boolean;
  created_at: string;
  updated_at: string;
  teacher?: Profile;
  learner?: Profile;
  skill?: Skill;
}

export interface Conversation {
  id: string;
  exchange_id: string;
  participant_one: string;
  participant_two: string;
  last_message_text: string | null;
  last_message_at: string;
  created_at: string;
  other_participant?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

export interface LearningProgress {
  id: string;
  exchange_id: string;
  user_id: string;
  goal_title: string;
  starting_level: ProficiencyLevel;
  current_level: ProficiencyLevel;
  target_level: ProficiencyLevel;
  progress_percent: number;
  milestones: Array<{ id?: string; title: string; completed: boolean; completed_at?: string }>;
  session_logs?: Array<{ id: string; date: string; hours: number; summary: string }>;
  hours_logged?: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  exchange?: ExchangeRequest;
}

export interface Review {
  id: string;
  session_id: string;
  reviewer_id: string;
  reviewee_id: string;
  skill_id: string | null;
  rating: number;
  knowledge_rating: number;
  communication_rating: number;
  punctuality_rating: number;
  feedback: string | null;
  created_at: string;
  reviewer?: Profile;
  skill?: Skill;
}

export interface SkillEndorsement {
  id: string;
  endorser_id: string;
  recipient_id: string;
  skill_id: string;
  comment: string | null;
  created_at: string;
  endorser?: Profile;
  skill?: Skill;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  content: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
  actor?: Profile;
}

export interface CommunityPost {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: string;
  skill_id: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
  skill?: Skill;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface ReportItem {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  target_type?: 'user' | 'message' | 'post' | 'comment';
  target_id?: string | null;
  content_snippet?: string | null;
  reason: string;
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  reporter?: Profile;
  reported_user?: Profile;
}

export type MatchPriority = 'reciprocal' | 'complementary' | 'one_way' | 'chain';

export interface AvailabilityWindow {
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  overlapMinutes: number;
  formattedOverlap: string;
}

export interface MatchScoreBreakdown {
  skillNeed: number; // max 40
  reciprocal: number; // max 20
  availability: number; // max 15
  expertise: number; // max 10
  location: number; // max 5
  format: number; // max 5
  language: number; // max 5
  total: number; // 0 - 100
}

export interface MatchResult {
  member: Profile;
  compatibilityScore: number;
  mutualMatch: boolean;
  matchType: MatchPriority;
  matchTypeLabel: string;
  skillsTheyTeachYouWant: Skill[];
  skillsYouTeachTheyWant: Skill[];
  coursesTheyCanTeach?: Course[];
  peerAllTeaching?: Skill[];
  peerAllLearning?: Skill[];
  isExploratory?: boolean;
  availabilityOverlapCount: number;
  totalOverlapMinutes: number;
  overlappingWindows: AvailabilityWindow[];
  sharedLanguages: string[];
  reasons: string[];
  scoreBreakdown: MatchScoreBreakdown;
  expertiseAssessment?: string;
  locationStatus?: string;
  formatStatus?: string;
  hasActiveRequest?: boolean;
  activeRequestStatus?: 'pending' | 'accepted' | null;
  isSaved?: boolean;
  isDismissed?: boolean;
  potentialChain?: {
    partnerName: string;
    skillsExchanged: string;
  };
}

export type ConnectionStatus = 'pending' | 'connected' | 'declined';

export interface Connection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: ConnectionStatus;
  note?: string | null;
  created_at: string;
  updated_at: string;
  requester?: Profile;
  recipient?: Profile;
}
