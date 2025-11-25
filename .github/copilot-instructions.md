# Skillingo AI Copilot Instructions

## Project Overview
Skillingo is a gamified learning platform built with **Expo Router (file-based routing)**, **React Native**, **TypeScript**, and **Supabase** (PostgreSQL + Auth + RLS). The app teaches soft skills (Creativity, Critical Thinking, Communication, etc.) through structured lessons with quizzes and XP rewards.

## Architecture & Data Flow

### Key Components
- **Auth Flow**: `AuthProvider` (contexts/AuthContext.tsx) wraps app with `user`, `session`, `profile` state. Session persists via localStorage (web) or AsyncStorage (native)
- **Database Layer**: `lib/db.ts` exports typed functions (`getSkills()`, `getLessonsBySkillId()`, `trackLessonAttempt()`, etc.) that interact with Supabase via `lib/supabase.ts`
- **Navigation**: Expo Router file-based routing in `app/` directory
  - `app/(tabs)/` - Bottom tab navigation (home, explore, profile)
  - `app/skills/[skillId].tsx` - Dynamic route for skill lessons list
  - `app/[lessonId].tsx` - Dynamic route for lesson viewer with steps + quiz
  - `app/modal.tsx` - Modal screen for info/settings
- **Types**: Database types in `types/database.types.ts` (generated via `npm run supabase:types`), lesson types in `types/lesson.types.ts`

### Data Flow Pattern
1. **Read**: Screen → DB function (`lib/db.ts`) → Supabase client → RLS-secured query → UI
2. **Write**: User action → DB function → Supabase insert/update → **Trigger fires** → Auto-update XP/progress/achievements
3. **Auth**: Supabase Auth → `AuthContext` → Protected routes check `user` state

### Critical: Lesson Content Storage
**Lessons are stored in PostgreSQL JSONB** (`lessons.content` column), not separate tables:
```typescript
interface LessonContent {
  introduction: string;
  steps: LessonStep[];  // text, code, video, interactive
  quiz?: Quiz;          // questions with correct_answer index
  resources?: Resource[];
}
```

## Database Architecture

### Row-Level Security (RLS)
**Never manually attach `user_id` in client code** - RLS policies automatically scope queries to authenticated user via `auth.uid()`. Example: `getCurrentUserProfile()` uses `.eq('id', uid)` after confirming auth, but RLS ensures user can only access their own row.

### Automatic XP & Progress (Server-Side)
Database trigger `trg_after_lesson_attempts_upsert` (see `supabase/migrations/20251124_core_policies_triggers.sql`):
- Fires on `lesson_attempts` INSERT/UPDATE when `completed = true`
- Calculates XP based on score + difficulty (easy=10, medium=20, hard=30 max)
- Updates `users.total_xp` and `users.level` (level = 1 + total_xp/100)
- Updates `user_progress.progress_percent` to 100% for that skill
- Awards "first_lesson" achievement if first completion

**Client code only calls `trackLessonAttempt({lesson_id, score, completed})` - server handles the rest**.

### Key Tables
- `users` - Profile (username, avatar_url, total_xp, level, role)
- `skills` - Skill metadata (name, description)
- `lessons` - Lessons with JSONB content column
- `lesson_attempts` - User quiz results (triggers XP calculation)
- `user_progress` - Skill completion % per user
- `achievements` + `user_achievements` - Badge system
- `community_posts` + `post_ratings` - Social features (status: pending/approved/rejected)

## Development Conventions

### File Routing
Dynamic routes use `[paramName].tsx` convention:
```typescript
// app/skills/[skillId].tsx
const params = useLocalSearchParams();
const skillId = parseInt(params.skillId as string, 10);

// Navigate to dynamic route:
router.push({ pathname: '/skills/[skillId]', params: { skillId: '1' } });
```

### Component Patterns
1. **Data fetching on mount**:
```typescript
useEffect(() => { loadData(); }, [skillId]);
const loadData = async () => {
  try {
    setLoading(true);
    const data = await getSkills();
    setSkills(data);
  } catch (err) { setError(err.message); }
  finally { setLoading(false); }
};
```

2. **Loading/Error states**: Always render `ActivityIndicator` during loading, and error message + retry button on failure

3. **Color scheme**: Use `useColorScheme()` hook and `Colors` constants (constants/Colors.ts) for theme-aware styling

### Styling Patterns
- **Skill cards**: Color-coded via `SKILL_STYLES` map (Creativity=#10b981/green, Critical Thinking=#3b82f6/blue, etc.)
- **Difficulty badges**: Traffic light colors (easy=#10b981, medium=#f59e0b, hard=#ef4444)
- **Progress bars**: Filled percentage width with `{ width: `${progress}%` }` pattern

### Navigation Flow
Home → Skill card tap → `app/skills/[skillId].tsx` (lessons list) → Lesson tap → `app/[lessonId].tsx` (lesson viewer) → Quiz completion → XP awarded → Navigate back

## Critical Functions (lib/db.ts)

### Skills & Lessons
- `getSkills()` - Returns `SkillWithProgress[]` with joined user progress
- `getLessonsBySkillId(skillId)` - Returns `LessonWithCompletion[]` with completed flag
- `getLessonById(lessonId)` - Fetches single lesson with JSONB content parsed
- `trackLessonAttempt({lesson_id, score?, completed?})` - Saves attempt (triggers XP calculation)

### User Profile
- `getCurrentUserProfile()` - Returns current user's profile from `users` table
- `getUserStreak()` - Calculates consecutive days with activity
- `addUserXp(xpAmount)` - **Deprecated** (use `trackLessonAttempt` instead - trigger handles XP)

### Community (Social Features)
- `createCommunityPost({title, content, category})` - Creates post with status='pending'
- `listCommunityPosts({category?, limit?, offset?})` - Returns approved posts only
- `moderatePost(postId, 'approve'|'reject')` - Requires moderator role (RLS enforced)
- `ratePost(postId, rating)` - User rates post (upserts with unique constraint)

## Commands

### Development
- `npm run web` - Start Expo web dev server (typical workflow)
- `npm run android` - Start Android emulator
- `npm run ios` - Start iOS simulator
- `npm start` - Start Expo dev server (choose platform interactively)

### Database
- `npm run supabase:types` - Regenerate `types/database.types.ts` from Supabase schema (run after migrations)

### Linting
- `npm run lint` - ESLint with autofix enabled

## Common Gotchas

1. **Auth check pattern**: Always verify auth before DB operations requiring user context:
```typescript
async function requireAuthUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not authenticated');
  return data.user.id;
}
```

2. **Don't manually calculate XP/levels in client** - The database trigger handles this automatically when you insert a completed `lesson_attempt`

3. **Lesson content is JSONB** - When seeding lessons, insert as JSON object, not separate rows:
```sql
INSERT INTO lessons (skill_id, title, difficulty, xp_reward, content)
VALUES (1, 'Intro to Creativity', 'easy', 50, '{"introduction": "...", "steps": [...], "quiz": {...}}');
```

4. **Dynamic imports for native modules**: AsyncStorage/SecureStore are dynamically imported in `lib/supabase.ts` to avoid SSR warnings on web

5. **Router navigation**: Use `router.push()` for navigation, not `<Link>` in most cases (except header buttons). For dynamic routes, pass `{ pathname, params }` object

6. **Color scheme**: Dark mode is primary theme (`#1a1a1a` background, `#00d4ff` accent) - see `constants/Colors.ts`

## File Organization

```
app/                    # Expo Router file-based routes
├── (tabs)/            # Tab navigator group
│   ├── index.tsx      # Home screen (stats + skill cards)
│   └── two.tsx        # Explore/Social tab
├── skills/
│   ├── [skillId].tsx  # Lessons list for skill
│   └── index.tsx      # All skills list (alternative view)
├── [lessonId].tsx     # Lesson viewer with steps + quiz
├── login.tsx          # Auth screens
├── signup.tsx
└── onboarding.tsx     # Username selection after signup

components/
├── lesson/
│   └── QuizComponent.tsx  # Interactive quiz with scoring
└── Themed.tsx         # Theme-aware components

lib/
├── db.ts              # Database functions (main data layer)
├── supabase.ts        # Supabase client singleton
└── auth-helpers.ts    # Auth utilities

types/
├── database.types.ts  # Auto-generated from Supabase schema
├── lesson.types.ts    # Lesson/Quiz TypeScript interfaces
└── supabase.ts        # Supabase type helpers

supabase/migrations/   # SQL migrations (run on Supabase)
```

## Testing the Flow

1. **Seed skills**: Run SQL inserts for 10 skills (Creativity, Critical Thinking, Communication, etc.)
2. **Seed lessons**: Insert lessons with JSONB content for at least one skill
3. **Test path**: Login → Home → Tap skill → View lessons → Tap lesson → Complete steps → Take quiz → Verify XP/progress updates
4. **Check database**: Confirm `lesson_attempts`, `user_progress`, `users.total_xp` updated correctly

## When Making Changes

- **Adding new screen**: Create file in `app/` with proper route structure
- **Adding DB function**: Export from `lib/db.ts` with TypeScript return type from `types/`
- **Schema changes**: Create migration in `supabase/migrations/`, run on Supabase, then `npm run supabase:types`
- **New UI component**: Add to `components/` with theme support via `useColorScheme()`
- **Auth-protected route**: Check `user` state from `useAuth()` hook, redirect to `/login` if null
