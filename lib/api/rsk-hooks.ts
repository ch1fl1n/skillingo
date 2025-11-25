import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * ============================================================================
 * RSK-001: Data Integrity - Wiki Content Management with Optimistic Locking
 * ============================================================================
 * Manages version conflicts, rollback, moderation status using integer-based
 * optimistic locking and immutable revision history.
 */

export interface WikiPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  status: 'pending' | 'approved' | 'archived';
  version: number;
  created_by: string;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
  metadata?: Record<string, unknown>;
}

export interface WikiRevision {
  id: string;
  page_id: string;
  version: number;
  title: string;
  content: string;
  change_summary?: string;
  created_by: string;
  created_at: string;
}

export interface WikiAuditEntry {
  id: string;
  page_id: string;
  action: string;
  actor_id: string;
  actor_role: string;
  created_at: string;
  diff_summary?: Record<string, unknown>;
}

/**
 * Hook: Fetch a wiki page with its current version
 * Used to display content and get version for optimistic locking
 * Implements: RSK-001 - Read approved content or drafts by creator
 */
export function useWikiPage(slug: string) {
  return useQuery({
    queryKey: ['wiki', 'page', slug],
    queryFn: async (): Promise<WikiPage> => {
      const { data, error } = await supabase
        .from('wiki_pages')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return (data as unknown) as WikiPage;
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    enabled: !!slug,
  });
}

/**
 * Hook: Update a wiki page with optimistic locking
 * Conflict Resolution:
 *   - Attempt update with WHERE id = $id AND version = $expected
 *   - If 0 rows updated, version mismatch occurred
 *   - Return conflict flag; UI fetches latest and retries
 *
 * Implements: RSK-001 - Prevent concurrent overwrites
 */
export function useUpdateWikiPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      content,
      currentVersion,
      summary,
    }: {
      id: string;
      title: string;
      content: string;
      currentVersion: number;
      summary?: string;
    }) => {
      // Optimistic lock: only update if version matches
      const { data, error } = await supabase
        .from('wiki_pages')
        .update({
          title,
          content,
          metadata: { summary, edited_at: new Date().toISOString() },
        })
        .eq('id', id)
        .eq('version', currentVersion) // Critical: prevents conflict overwrites
        .select()
        .single();

      if (error) {
        // Fetch latest version for conflict resolution
        const { data: latest } = await supabase
          .from('wiki_pages')
          .select('version')
          .eq('id', id)
          .single();

        return {
          success: false,
          conflict: true,
          latestVersion: latest?.version,
        };
      }

      return {
        success: true,
        conflict: false,
        data: data as WikiPage,
      };
    },
    onSuccess: (result, variables) => {
      if (result.success && !result.conflict) {
        queryClient.invalidateQueries({
          queryKey: ['wiki', 'page', variables.id],
        });
      }
    },
  });
}

/**
 * Hook: Get revision history (immutable audit trail)
 * Implements: RSK-001 - Enable rollback and historical analysis
 */
export function useWikiRevisions(pageId: string) {
  return useQuery({
    queryKey: ['wiki', 'revisions', pageId],
    queryFn: async (): Promise<WikiRevision[]> => {
      const { data, error } = await supabase
        .from('wiki_revisions')
        .select('*')
        .eq('page_id', pageId)
        .order('version', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
    enabled: !!pageId,
  });
}

/**
 * Hook: Rollback to a prior revision (moderators/admins)
 * Invokes SQL function: wiki_rollback_to_revision()
 * Returns: success flag and message
 * Implements: RSK-001 - Restore exact prior content
 */
export function useRollbackWikiPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pageId,
      targetVersion,
    }: {
      pageId: string;
      targetVersion: number;
    }) => {
      const { data, error } = await supabase
        .rpc('wiki_rollback_to_revision', {
          p_page_id: pageId,
          p_target_version: targetVersion,
        });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['wiki', 'page', variables.pageId],
      });
      queryClient.invalidateQueries({
        queryKey: ['wiki', 'revisions', variables.pageId],
      });
    },
  });
}

/**
 * Hook: Get audit log (moderators/admins only)
 * Implements: RSK-001 - Full audit trail for compliance
 */
export function useWikiAuditLog(pageId: string) {
  return useQuery({
    queryKey: ['wiki', 'audit', pageId],
    queryFn: async (): Promise<WikiAuditEntry[]> => {
      const { data, error } = await supabase
        .from('wiki_audit')
        .select('*')
        .eq('page_id', pageId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
    enabled: !!pageId,
  });
}

/**
 * Hook: Approve or reject pending wiki content (moderators/admins)
 * Implements: RSK-001 - Moderation gate
 */
export function useModerateWikiPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pageId,
      action,
    }: {
      pageId: string;
      action: 'approve' | 'reject';
    }) => {
      const status = action === 'approve' ? 'approved' : 'archived';

      const { data, error } = await supabase
        .from('wiki_pages')
        .update({
          status,
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: action === 'approve' ? new Date().toISOString() : null,
        })
        .eq('id', pageId)
        .select()
        .single();

      if (error) throw error;
      return data as WikiPage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['wiki', 'page'],
      });
    },
  });
}

/**
 * ============================================================================
 * RSK-002: Low Engagement - Streaks and Challenge Mechanics
 * ============================================================================
 * Manages user streaks, seasonal challenges, and engagement notifications.
 */

export interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  total_xp_earned: number;
}

/**
 * Hook: Get user's current streak
 * Implements: RSK-002 - Surface streak metrics
 */
export function useUserStreak(userId?: string) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  return useQuery({
    queryKey: ['streaks', effectiveUserId],
    queryFn: async (): Promise<UserStreak> => {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', effectiveUserId)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
    enabled: !!effectiveUserId,
  });
}

/**
 * Hook: Get active seasonal challenges
 * Implements: RSK-002 - Seasonal motivation drivers
 */
export function useActiveChallenges() {
  return useQuery({
    queryKey: ['challenges', 'active'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('seasonal_challenges')
        .select('*')
        .lte('starts_at', now)
        .gte('ends_at', now);

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 2,
  });
}

/**
 * Hook: Get user's challenge progress
 * Implements: RSK-002 - Track challenge completion
 */
export function useUserChallengeProgress(userId?: string) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  return useQuery({
    queryKey: ['challenges', 'progress', effectiveUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_challenge_progress')
        .select('*, seasonal_challenges(*)')
        .eq('user_id', effectiveUserId);

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
    enabled: !!effectiveUserId,
  });
}

/**
 * ============================================================================
 * RSK-003: Performance - Pagination and Caching
 * ============================================================================
 * Implements keyset pagination, aggregated views, and lazy loading.
 */

export interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
  lastId?: string;
  lastCreated?: string;
}

/**
 * Hook: Paginated list with keyset continuation
 * Pattern: Use (created_at, id) tuple for stable, index-backed scrolling
 * Avoids expensive OFFSET; supports efficient edge-to-edge pagination
 * Implements: RSK-003 - Scalable list rendering
 */
export function useCommunityPostsPaginated(status: string = 'approved') {
  return useQuery<PaginatedResult<Record<string, unknown>>>({
    queryKey: ['posts', 'paginated', status],
    queryFn: async ({ pageParam = null }): Promise<PaginatedResult<Record<string, unknown>>> => {
      const limit = 20;

      const { data, error } = await supabase
        .rpc('paginate_community_posts', {
          p_status: status,
          p_last_id: pageParam?.lastId || null,
          p_last_created: pageParam?.lastCreated || null,
          p_limit: limit + 1,
        });

      if (error) throw error;

      const items = data?.slice(0, limit) || [];
      const hasMore = (data?.length || 0) > limit;

      return {
        items,
        hasMore,
        lastId: items[items.length - 1]?.id,
        lastCreated: items[items.length - 1]?.created_at,
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

/**
 * Hook: User progress summary (computed via materialized view or RPC)
 * Single query returns aggregated stats per skill
 * Implements: RSK-003 - Reduce N+1 queries
 */
export function useUserProgressSummary(userId?: string) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  return useQuery({
    queryKey: ['progress', 'summary', effectiveUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_user_progress_summary', {
          p_user_id: effectiveUserId,
        });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 2,
    enabled: !!effectiveUserId,
  });
}

/**
 * Hook: Complete dashboard data (single RPC call)
 * Returns: XP, level, streak, active challenges, skills, recent activity
 * Implements: RSK-003 - Minimize round-trips on app launch
 */
export function useUserDashboard(userId?: string) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  return useQuery({
    queryKey: ['dashboard', effectiveUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_user_dashboard_data', {
          p_user_id: effectiveUserId,
        });

      if (error) throw error;
      return data?.[0] || null;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: !!effectiveUserId,
  });
}
