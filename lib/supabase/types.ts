export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          role: "user" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string;
          role?: "user" | "admin";
          updated_at?: string;
        };
        Relationships: [];
      };
      prompts: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          description: string;
          body: string;
          category: string;
          tags: string[];
          status: "published" | "hidden";
          view_count: number;
          copy_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          description: string;
          body: string;
          category?: string;
          tags?: string[];
          status?: "published" | "hidden";
          view_count?: number;
          copy_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          body?: string;
          category?: string;
          tags?: string[];
          status?: "published" | "hidden";
          view_count?: number;
          copy_count?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prompts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      prompt_likes: {
        Row: {
          id: string;
          prompt_id: string;
          user_id: string | null;
          anon_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          prompt_id: string;
          user_id?: string | null;
          anon_id?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "prompt_likes_prompt_id_fkey";
            columns: ["prompt_id"];
            isOneToOne: false;
            referencedRelation: "prompts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prompt_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      prompt_reports: {
        Row: {
          id: string;
          prompt_id: string;
          reporter_id: string;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          prompt_id: string;
          reporter_id: string;
          reason: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "prompt_reports_prompt_id_fkey";
            columns: ["prompt_id"];
            isOneToOne: false;
            referencedRelation: "prompts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prompt_reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_prompt_copy_count: {
        Args: { target_prompt_id: string };
        Returns: void;
      };
      toggle_anonymous_prompt_like: {
        Args: {
          target_prompt_id: string;
          visitor_id: string;
          should_like: boolean;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type PromptRow = Database["public"]["Tables"]["prompts"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
