export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string
          description: string | null
          id: number
          name: string
          xp_reward: number | null
        }
        Insert: {
          code: string
          description?: string | null
          id?: number
          name: string
          xp_reward?: number | null
        }
        Update: {
          code?: string
          description?: string | null
          id?: number
          name?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          approved_at: string | null
          category: string | null
          content: string
          created_at: string | null
          id: number
          status: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          id?: number
          status?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          id?: number
          status?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      lesson_attempts: {
        Row: {
          attempted_at: string | null
          completed: boolean | null
          id: number
          lesson_id: number | null
          score: number | null
          user_id: string | null
        }
        Insert: {
          attempted_at?: string | null
          completed?: boolean | null
          id?: number
          lesson_id?: number | null
          score?: number | null
          user_id?: string | null
        }
        Update: {
          attempted_at?: string | null
          completed?: boolean | null
          id?: number
          lesson_id?: number | null
          score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: Json | null
          created_at: string | null
          difficulty: string | null
          id: number
          skill_id: number | null
          title: string
          xp_reward: number | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          difficulty?: string | null
          id?: number
          skill_id?: number | null
          title: string
          xp_reward?: number | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          difficulty?: string | null
          id?: number
          skill_id?: number | null
          title?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_queue: {
        Row: {
          id: number
          moderator_id: string | null
          post_id: number | null
          reviewed_at: string | null
          status: string | null
        }
        Insert: {
          id?: number
          moderator_id?: string | null
          post_id?: number | null
          reviewed_at?: string | null
          status?: string | null
        }
        Update: {
          id?: number
          moderator_id?: string | null
          post_id?: number | null
          reviewed_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_queue_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_ratings: {
        Row: {
          created_at: string | null
          id: number
          post_id: number | null
          rating: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          post_id?: number | null
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          post_id?: number | null
          rating?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_ratings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      proficiency_milestones: {
        Row: {
          badge_icon: string | null
          cefr_level: string
          created_at: string
          description: string
          id: string
          score_threshold: number
          skill_id: number
          title: string
          unlocks: Json | null
          xp_reward: number
        }
        Insert: {
          badge_icon?: string | null
          cefr_level: string
          created_at?: string
          description: string
          id?: string
          score_threshold: number
          skill_id: number
          title: string
          unlocks?: Json | null
          xp_reward?: number
        }
        Update: {
          badge_icon?: string | null
          cefr_level?: string
          created_at?: string
          description?: string
          id?: string
          score_threshold?: number
          skill_id?: number
          title?: string
          unlocks?: Json | null
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "proficiency_milestones_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_proficiency_scores: {
        Row: {
          assessments_completed: number
          cefr_level: string
          confidence_interval: number | null
          created_at: string
          current_score: number
          id: string
          last_assessment_date: string | null
          next_assessment_date: string | null
          previous_score: number | null
          skill_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          assessments_completed?: number
          cefr_level: string
          confidence_interval?: number | null
          created_at?: string
          current_score?: number
          id?: string
          last_assessment_date?: string | null
          next_assessment_date?: string | null
          previous_score?: number | null
          skill_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          assessments_completed?: number
          cefr_level?: string
          confidence_interval?: number | null
          created_at?: string
          current_score?: number
          id?: string
          last_assessment_date?: string | null
          next_assessment_date?: string | null
          previous_score?: number | null
          skill_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_proficiency_scores_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          description: string | null
          id: number
          name: string
        }
        Insert: {
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achieved_at: string | null
          achievement_id: number | null
          id: number
          user_id: string | null
        }
        Insert: {
          achieved_at?: string | null
          achievement_id?: number | null
          id?: number
          user_id?: string | null
        }
        Update: {
          achieved_at?: string | null
          achievement_id?: number | null
          id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          id: number
          last_updated: string | null
          progress_percent: number | null
          skill_id: number | null
          user_id: string | null
        }
        Insert: {
          id?: number
          last_updated?: string | null
          progress_percent?: number | null
          skill_id?: number | null
          user_id?: string | null
        }
        Update: {
          id?: number
          last_updated?: string | null
          progress_percent?: number | null
          skill_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          level: number
          password_hash: string | null
          role: string
          total_xp: number
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          level?: number
          password_hash?: string | null
          role?: string
          total_xp?: number
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          level?: number
          password_hash?: string | null
          role?: string
          total_xp?: number
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
