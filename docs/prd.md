# Requirements Document

## 1. Application Overview

### 1.1 Application Name
SkillXChange

### 1.2 Application Description
SkillXChange is a peer-to-peer web application for non-monetary skill exchange, collaborative learning, and community engagement. The platform connects users who want to teach skills with those seeking to learn skills or courses through matching, scheduling (online and in-person), direct messaging, peer connections, progress tracking, community interaction, and administrative moderation and analytics.

## 2. User Roles

- **Visitor / Guest**: Unauthenticated user who browses the public landing page, explores skill/course categories, and registers or logs in.
- **Onboarding Member**: Authenticated user with incomplete onboarding who is restricted to completing the mandatory teaching and learning profile configuration.
- **Member (User)**: Authenticated user who has completed onboarding, possesses at least one teaching skill and one learning interest, and actively participates in exchanges, scheduled sessions, direct messaging, learning tracking, and community discussions.
- **Administrator**: Privileged user managing accounts, skill and course taxonomies, exchange records, moderation queues, community reports, analytics on participation, and system maintenance. Initialized with administrator privileges assigned to shaikafroz5502@gmail.com.

## 3. Page Structure and Functional Description

### 3.1 Information Architecture
```text
SkillXChange
├── Public Pages
│   ├── Landing Page
│   ├── Registration & Onboarding Flow
│   │   ├── Step 1: Account Details
│   │   ├── Step 2: What Can You Teach? (Preset Skills & Custom Other Skill Option)
│   │   ├── Step 3: What Do You Want to Learn? (Preset Skills & Custom Other Skill Option)
│   │   ├── Step 4: Profile Details, Spoken Languages (Preset & Custom Other Language) & Privacy Settings
│   │   └── Step 5: Review & Confirmation
│   ├── Login Page
│   └── Password Reset Flow
├── User Portal (Authenticated & Onboarded)
│   ├── User Dashboard
│   ├── Explore & Search (Skills & Courses)
│   ├── Smart Matches Hub
│   │   ├── Best Matches Feed
│   │   ├── Direct Reciprocal Matches Feed
│   │   ├── People Who Can Teach What You Want Feed
│   │   ├── People Who Want What You Can Teach Feed
│   │   ├── Available Matches Feed
│   │   ├── Nearby Matches Feed
│   │   ├── Online Matches Feed
│   │   ├── New Matches Feed
│   │   └── Saved Matches Feed
│   ├── Peer Connections
│   ├── Exchange Requests
│   ├── Schedule & Sessions Calendar (Online & In-Person)
│   ├── Chat & Messages
│   ├── Learning Progress Tracker
│   ├── Community Hub & Discussions
│   ├── Notifications Center
│   ├── User Profile & Settings
│   └── Public Member Profile View
└── Admin Portal (Role-Restricted)
    ├── Admin Dashboard & Analytics (Community Participation & Exchange Metrics)
    ├── User Management
    ├── Skill Catalog Management
    ├── Course Catalog Management
    ├── Exchange & Session Oversight
    ├── Safety, Reports & Community Moderation
    └── System Maintenance
```

### 3.2 Public Pages & Authentication

#### 3.2.1 Landing Page
- **Hero Section**: Value proposition with call-to-action buttons for registration and skill/course exploration.
- **How It Works**: Linear flow explaining profile creation, skill matching, session booking, and reciprocal learning.
- **Live Stats & Metrics**: Dynamic counters displaying platform totals (active members, skills offered, courses available, completed sessions).
- **Skill & Course Showcase**: Categorized card grid highlighting trending skills and top courses across predefined categories.
- **Trust & Community Pillars**: Informational cards covering non-monetary reciprocity, trust scoring, and safety.
- **Footer**: Navigation links for guidelines, terms of service, privacy policy, and support.

#### 3.2.2 Mandatory Multi-Step Onboarding Flow
- **Onboarding State Enforcement**: User onboarding status is tracked as not_started, in_progress, or completed. Unauthenticated users who register or authenticated users with incomplete onboarding are routed directly to their current onboarding step upon logging in.
- **Step 1: Account Setup**: Form collecting full name, username, email address, password, and password confirmation.
- **Step 2: What Can You Teach?**:
  - Skill selector populated from demo skills catalog categorized by domain.
  - **「Other」 Custom Skill Option**: Users can select 「Other」 to input custom skill name and category, registering it dynamically into the global catalog.
  - Expertise level selector (Beginner, Intermediate, Advanced, Expert), years of experience, teaching format preference (Online, In-Person, Both), and experience notes.
  - Validation halts progression if zero teaching skills are selected/added.
- **Step 3: What Do You Want to Learn?**:
  - Skill & course selector populated from the catalog with target proficiency goals and preferred minimum teacher expertise level.
  - **「Other」 Custom Learning Skill Option**: Users can select 「Other」 to specify custom skills or learning topics.
  - Validation halts progression if zero learning interests are selected/added.
- **Step 4: Profile Details & Preferences**:
  - Profile picture upload/URL, bio, location details (Country, State/Region, City), discovery visibility toggle, location matching toggle, timezone selection, and weekly recurring availability schedule.
  - **Spoken Languages Selector**: Predefined popular languages list plus an **「Other」 Custom Language Option**.
- **Step 5: Review & Finalize**: Summary screen displaying selected/custom teaching skills, learning courses/skills, languages, and profile info with completion trigger.

#### 3.2.3 Login & Password Recovery
- **Login**: Standard login form supporting email/username and password entry with session persistence.
- **Password Reset**: Verification flow to request reset links and update credentials.
- **Role-Based Routing & Default Admin**: Directs completed members to the User Dashboard and administrators to the Admin Portal. Account with email shaikafroz5502@gmail.com is automatically granted administrator privileges.

### 3.3 User Portal

#### 3.3.1 User Dashboard
- **Metric Summary Cards**: Metrics for active exchanges, upcoming sessions, peer connections count, reputation score, and unread items.
- **Action Center**: Task list for incoming exchange requests, pending connection requests, next scheduled online/in-person session, and recent messages.
- **Recommended Matches Widget**: Card list featuring top smart matches with compatibility scores and quick-connect triggers.
- **Quick Skill Management**: Shortcut to add or manage teaching and learning skills.

#### 3.3.2 Smart Matches Discovery Hub
- **Categorized Match Sections**: Best Matches, Direct Reciprocal Matches, People Who Can Teach What You Want, People Who Want What You Can Teach, Available Matches, Nearby Matches, Online Matches, New Matches, and Saved Matches.
- **Filter & Search Panel**: Skill/course selectors, match type filter, format (Online/In-Person), location, and language filters.
- **Match Cards**: Display member info, compatibility score breakdown, format options, and direct action triggers (Send Exchange Request, Message, Save Match).

#### 3.3.3 User Profile & Settings
- **Personal Info & Preferences**: Display name, bio, location (City, State/Region, Country), timezone, discovery toggle, and delivery format preference (Online, In-Person, Both).
- **Skills & Interests Management**: Add or remove teaching skills and learning goals (preserves minimum invariant of 1 each).
- **Public Profile View**: Structured card showing profile details, skills offered, learning goals, ratings, and report/block actions.

#### 3.3.4 Peer Connection Network
- **Connection Management Hub**: Categorized tabs for Connected Peers, Pending Sent Requests, and Pending Received Requests.
- **Send / Respond to Connection**: Send requests from profile or match cards; accept, decline, or remove connections.

#### 3.3.5 Explore & Search
- **Search Header**: Keyword matching across members, bios, standard and custom skill tags, and course titles.
- **Filter Sidebar**: Multi-attribute filtering by category, format (Online/In-Person), level, language, and location.

#### 3.3.6 Exchange Requests & Proposal Delivery
- **Request Creation Modal**: Form specifying offered teaching skill, requested learning skill or course, proposal message note, and delivery format (Online or In-Person).
- **Proposal Action Center**: Tabbed center (Incoming, Outgoing, Active, Archived) to accept, decline, or cancel requests.

#### 3.3.7 Availability & Session Scheduling (Online & In-Person)
- **Calendar View**: Monthly and weekly calendar view displaying confirmed, pending, and past sessions.
- **Session Detail & Format Information**:
  - **Online Sessions**: Includes meeting link/URL, virtual platform notes, and timezone-adjusted start/end times.
  - **In-Person Sessions**: Includes meeting location name/address, meeting point instructions, and safety reminders.
- **Booking Modal**: Propose date, time slot, duration, format (Online/In-Person), and meeting link or location details.
- **Session Lifecycle**: Accept, reschedule, cancel, and dual-party completion confirmation triggers.

#### 3.3.8 Chat & Direct Messaging
- **Unified Inbox Layout**: Split-view interface with conversation thread list and active dialogue pane.
- **Message Thread**: Message history display with timestamps and delivery statuses.
- **Inline Report Action**: Action trigger within message threads to report inappropriate messages or harassment.

#### 3.3.9 Learning Progress Tracker
- **Exchange Learning Goals**: Overview of learning objectives and agreed topics for each active skill exchange.
- **Milestones & Session Log**: Checklist of completed sessions (online/in-person), completed milestones, and hours logged.
- **Progress Indicators**: Visual percentage progress bar tracking exchange completion status against defined learning targets.
- **Shared Workspace Notes**: Note-taking interface for learning resources, session takeaways, and homework/action items.

#### 3.3.10 Ratings, Reviews & Endorsements
- **Review Submission**: Multi-criteria 1 to 5 star evaluation form upon session completion.
- **Skill Endorsements**: Endorsement actions on peer teaching skills.

#### 3.3.11 Community Hub & Discussions
- **Discussion Forum**: Topic-categorized boards for skill domains, learning tips, and general Q&A.
- **Post Interaction**: Create discussion threads, reply to posts, and upvote.
- **Post Reporting**: Report button on posts and comments to flag inappropriate content directly to moderators.

#### 3.3.12 Safety, Reporting & User Blocking
- **Reporting System**: Dedicated reporting modal available on member profiles, direct messages, and community forum posts.
- **Report Categories**: Harassment/Abuse, Inappropriate Content, Spam/Commercial Solicitation, No-Show/Scam, and Safety Concern.
- **User Blocking**: Block user toggle that immediately prevents direct messaging, session scheduling, and matching visibility.

#### 3.3.13 Notifications Center
- **Categorized Notification Feeds**: Filterable by All, Exchange Requests, Messages, Sessions, and Community Activity.
- **Exchange Request Notifications**: Alerts for new incoming proposals, proposal acceptances, rejections, and cancellations.
- **Message Notifications**: Real-time alerts and unread badges for incoming direct messages.
- **Session Notifications**: Alerts for session booking invitations, session confirmations, rescheduling, reminders prior to upcoming online/in-person sessions, and post-session review prompts.

### 3.4 Admin Portal

#### 3.4.1 Admin Dashboard & Community Analytics
- **Community Participation Analytics**: KPI cards and trends for active daily/monthly users, community post counts, discussion reply activity, and user onboarding completion rates.
- **Skill Exchange Analytics**: Visual metrics for total exchange proposals created, accepted vs. declined ratios, completed online vs. in-person sessions, total learning hours logged, and top exchanged skills.

#### 3.4.2 User Management
- **Data Table**: Searchable, filterable table listing users, roles, account status, and reputation scores, with role adjustment, suspension, and ban actions.
- **Designated Super Admin**: Account associated with shaikafroz5502@gmail.com is provisioned with permanent administrator privileges.

#### 3.4.3 Skill & Course Catalog Management
- **Catalog Management**: View, edit, merge, categorize, activate, and deactivate standard and custom skills/courses.

#### 3.4.4 Safety, Reports & Community Moderation
- **Moderation Queue**: Centralized queue displaying submitted reports for inappropriate users, direct messages, and community posts/replies.
- **Moderation Actions**: Review evidence, dismiss report, warn user, remove inappropriate post/comment, suspend user account, or issue permanent ban.

#### 3.4.5 System Maintenance
- **Maintenance Center**: System health indicators and administrative utility to generate and download timestamped source code backup archives.

## 4. Business Rules and Core Logic

### 4.1 Session Format & Scheduling Rules
1. Every session proposal must explicitly designate format as either Online or In-Person.
2. Online sessions require a valid virtual meeting URL/link.
3. In-Person sessions require valid location details (place name/address) and display safety advisory notices.
4. Session times are stored in UTC and rendered in the respective local timezones of both participants.

### 4.2 Learning Progress Tracking Rules
1. An exchange progress tracker is initialized when an exchange proposal is accepted.
2. Progress percentage is automatically recalculated based on logged completed sessions and completed learning milestones.
3. Both exchange partners have shared view access to progress milestones and session notes.

### 4.3 Notification Delivery Rules
1. Notifications are generated automatically upon:
   - Exchange Request actions (Received, Accepted, Declined, Cancelled).
   - Message events (New direct message received).
   - Session events (Proposed, Confirmed, Rescheduled, Cancelled, Starting Reminder, Completion Prompt).
2. Notifications contain direct navigation links to the relevant exchange, message thread, or session card.

### 4.4 Community Moderation & Reporting Rules
1. Users can report any member profile, direct message thread, or community forum post/reply with a mandatory reason category and optional description.
2. Content receiving multiple reports or flagged under severe violation categories is prioritized in the Admin Moderation Queue.
3. Administrators can take immediate moderation actions (dismiss, delete content, issue formal warning, temporary suspension, permanent ban).
4. Banned or suspended users are prevented from creating posts, sending messages, or booking sessions.

### 4.5 Community & Exchange Analytics Rules
1. Platform analytics aggregate data on user participation (login frequency, discussion threads, comments) and exchange volume (proposals, session format breakdown, completed exchanges).
2. Metrics update dynamically to provide administrators with platform health and engagement visibility.

### 4.6 Mandatory Onboarding & Minimum Skill Invariants
1. Every registered user must maintain at least one teaching skill (teaching_skills_count >= 1) and at least one learning interest (learning_interests_count >= 1) at all times.
2. Profile deletion requests reducing teaching skills or learning interests below 1 are prevented by system validation.

## 5. Exceptions and Edge Cases

| Scenario | Trigger Condition | System Behavior |
| :--- | :--- | :--- |
| Missing Online Meeting Link | User selects Online session format but omits meeting link | Halts booking submission and displays validation error requiring meeting link |
| Missing In-Person Location | User selects In-Person session format but leaves location empty | Halts booking submission and displays validation error requiring meeting location |
| Inappropriate Content Reported | User submits report on forum post or chat message | Creates moderation ticket in Admin Moderation Queue and displays confirmation prompt to reporter |
| Blocked User Interaction | User attempts to message or book session with a member who blocked them | System rejects action and displays notice that interaction is unavailable |
| Unread Notification Overflow | User receives extensive volume of notifications | Groups notifications chronologically with Mark All as Read capability |
| Attempt to Remove Last Skill | User attempts to delete only remaining teaching or learning skill | Blocks deletion and displays invariant error notice |

## 6. Acceptance Criteria

1. Users can schedule sessions by explicitly specifying Online (with meeting link) or In-Person (with physical location details) formats.
2. Active exchanges provide a Learning Progress Tracker displaying milestones, session logs, progress percentages, and shared notes.
3. Users receive automated notifications for exchange proposal updates, incoming messages, and upcoming session reminders.
4. Users can report inappropriate members, direct messages, and community forum posts through a reporting modal with categorized violation reasons.
5. Administrators can access the Moderation Queue to inspect reports, remove offending community content, and apply warnings or account suspensions/bans.
6. Administrators can view analytics dashboards covering community participation metrics and skill exchange statistics (online vs. in-person ratios, completion rates, top skills).
7. The designated administrator account shaikafroz5502@gmail.com is provisioned with administrator access upon registration/login.

## 7. Out of Scope

1. Integrated native peer-to-peer video streaming infrastructure requiring proprietary WebRTC media server hosting.
2. Monetary payment gateways or paid course subscriptions.
3. Automated AI speech transcription during live sessions.
4. Real-time multi-lingual machine translation of discussion forums.