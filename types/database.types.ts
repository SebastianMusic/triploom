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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcement: {
        Row: {
          created_at: string
          description: string | null
          id: string
          participant_id: string | null
          title: string | null
          trip_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          participant_id?: string | null
          title?: string | null
          trip_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          participant_id?: string | null
          title?: string | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcement_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_image: {
        Row: {
          created_at: string
          image_url: string
          message_id: string
        }
        Insert: {
          created_at?: string
          image_url: string
          message_id: string
        }
        Update: {
          created_at?: string
          image_url?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_image_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "message"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participant: {
        Row: {
          group_chat_id: string
          last_read_at: string | null
          participant_id: string
        }
        Insert: {
          group_chat_id: string
          last_read_at?: string | null
          participant_id: string
        }
        Update: {
          group_chat_id?: string
          last_read_at?: string | null
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participant_group_chat_id_fkey"
            columns: ["group_chat_id"]
            isOneToOne: false
            referencedRelation: "group_chat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participant_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participant"
            referencedColumns: ["id"]
          },
        ]
      }
      event: {
        Row: {
          banner_image_url: string | null
          created_at: string
          created_by_id: string | null
          description: string | null
          end_time: string | null
          id: string
          is_optional: boolean | null
          location: string | null
          price_range: string | null
          start_time: string | null
          title: string | null
          trip_id: string | null
        }
        Insert: {
          banner_image_url?: string | null
          created_at?: string
          created_by_id?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_optional?: boolean | null
          location?: string | null
          price_range?: string | null
          start_time?: string | null
          title?: string | null
          trip_id?: string | null
        }
        Update: {
          banner_image_url?: string | null
          created_at?: string
          created_by_id?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_optional?: boolean | null
          location?: string | null
          price_range?: string | null
          start_time?: string | null
          title?: string | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "trip_participant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participation: {
        Row: {
          created_at: string
          event_id: string
          participant_id: string
          role: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          participant_id: string
          role?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          participant_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_participation_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participation_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participant"
            referencedColumns: ["id"]
          },
        ]
      }
      group_chat: {
        Row: {
          chat_name: string | null
          created_at: string
          event_id: string | null
          id: string
          trip_group_id: string | null
          trip_id: string | null
        }
        Insert: {
          chat_name?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          trip_group_id?: string | null
          trip_id?: string | null
        }
        Update: {
          chat_name?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          trip_group_id?: string | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_chat_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_chat_trip_group_id_fkey"
            columns: ["trip_group_id"]
            isOneToOne: false
            referencedRelation: "trip_group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_chat_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip"
            referencedColumns: ["id"]
          },
        ]
      }
      group_membership: {
        Row: {
          created_at: string
          group_id: string
          participant_id: string
          role: string | null
        }
        Insert: {
          created_at?: string
          group_id: string
          participant_id: string
          role?: string | null
        }
        Update: {
          created_at?: string
          group_id?: string
          participant_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_membership_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "trip_group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_membership_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participant"
            referencedColumns: ["id"]
          },
        ]
      }
      message: {
        Row: {
          content: string | null
          created_at: string
          deleted_at: string | null
          group_chat_id: string | null
          id: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          group_chat_id?: string | null
          id?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          group_chat_id?: string | null
          id?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_group_chat_id_fkey"
            columns: ["group_chat_id"]
            isOneToOne: false
            referencedRelation: "group_chat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      message_location: {
        Row: {
          id: string
          label: string | null
          latitude: number
          longitude: number
          message_id: string
        }
        Insert: {
          id?: string
          label?: string | null
          latitude: number
          longitude: number
          message_id: string
        }
        Update: {
          id?: string
          label?: string | null
          latitude?: number
          longitude?: number
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_location_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "message"
            referencedColumns: ["id"]
          },
        ]
      }
      profile: {
        Row: {
          email: string | null
          expo_push_token: string | null
          id: string
          phonenumber: string | null
          profile_picture_url: string | null
          selected_trip: string | null
          user_name: string | null
        }
        Insert: {
          email?: string | null
          expo_push_token?: string | null
          id?: string
          phonenumber?: string | null
          profile_picture_url?: string | null
          selected_trip?: string | null
          user_name?: string | null
        }
        Update: {
          email?: string | null
          expo_push_token?: string | null
          id?: string
          phonenumber?: string | null
          profile_picture_url?: string | null
          selected_trip?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_selected_trip_fkey"
            columns: ["selected_trip"]
            isOneToOne: false
            referencedRelation: "trip"
            referencedColumns: ["id"]
          },
        ]
      }
      task: {
        Row: {
          created_at: string
          description: string | null
          due_time: string | null
          id: string
          title: string | null
          trip_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_time?: string | null
          id?: string
          title?: string | null
          trip_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          due_time?: string | null
          id?: string
          title?: string | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignment: {
        Row: {
          completed_at: string
          is_completed: boolean | null
          participant_id: string
          response: string | null
          task_id: string
        }
        Insert: {
          completed_at: string
          is_completed?: boolean | null
          participant_id: string
          response?: string | null
          task_id: string
        }
        Update: {
          completed_at?: string
          is_completed?: boolean | null
          participant_id?: string
          response?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignment_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignment_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task"
            referencedColumns: ["id"]
          },
        ]
      }
      task_field: {
        Row: {
          id: string
          label: string
          sort_order: number
          task_id: string
          type: string
        }
        Insert: {
          id?: string
          label: string
          sort_order?: number
          task_id: string
          type: string
        }
        Update: {
          id?: string
          label?: string
          sort_order?: number
          task_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_field_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task"
            referencedColumns: ["id"]
          },
        ]
      }
      task_field_option: {
        Row: {
          id: string
          label: string
          sort_order: number
          task_field_id: string
        }
        Insert: {
          id?: string
          label: string
          sort_order?: number
          task_field_id: string
        }
        Update: {
          id?: string
          label?: string
          sort_order?: number
          task_field_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_field_option_task_field_id_fkey"
            columns: ["task_field_id"]
            isOneToOne: false
            referencedRelation: "task_field"
            referencedColumns: ["id"]
          },
        ]
      }
      task_field_response: {
        Row: {
          id: string
          is_checked: boolean | null
          option_id: string | null
          participant_id: string
          task_field_id: string
          value: string | null
        }
        Insert: {
          id?: string
          is_checked?: boolean | null
          option_id?: string | null
          participant_id: string
          task_field_id: string
          value?: string | null
        }
        Update: {
          id?: string
          is_checked?: boolean | null
          option_id?: string | null
          participant_id?: string
          task_field_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_field_response_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "task_field_option"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_field_response_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_field_response_task_field_id_fkey"
            columns: ["task_field_id"]
            isOneToOne: false
            referencedRelation: "task_field"
            referencedColumns: ["id"]
          },
        ]
      }
      trip: {
        Row: {
          banner_image_url: string | null
          created_at: string
          description: string | null
          description_file_url: string | null
          end_date: string | null
          event_permission: string | null
          id: string
          name: string | null
          organizer_id: string | null
          start_date: string | null
        }
        Insert: {
          banner_image_url?: string | null
          created_at?: string
          description?: string | null
          description_file_url?: string | null
          end_date?: string | null
          event_permission?: string | null
          id?: string
          name?: string | null
          organizer_id?: string | null
          start_date?: string | null
        }
        Update: {
          banner_image_url?: string | null
          created_at?: string
          description?: string | null
          description_file_url?: string | null
          end_date?: string | null
          event_permission?: string | null
          id?: string
          name?: string | null
          organizer_id?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_group: {
        Row: {
          created_at: string
          description: string | null
          id: string
          max_members: number | null
          max_size: number | null
          name: string | null
          trip_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          max_members?: number | null
          max_size?: number | null
          name?: string | null
          trip_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          max_members?: number | null
          max_size?: number | null
          name?: string | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_group_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_invite_url: {
        Row: {
          created_at: string
          expiration_date: string | null
          invite_url: string
          trip_id: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          expiration_date?: string | null
          invite_url: string
          trip_id?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          expiration_date?: string | null
          invite_url?: string
          trip_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_invite_url_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_participant: {
        Row: {
          created_at: string
          id: string
          role: string | null
          trip_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string | null
          trip_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: string | null
          trip_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_participant_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_participant_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_chat_rooms_for_trip: {
        Args: { trip_id_param: string }
        Returns: {
          chat_name: string
          created_at: string
          event_id: string
          has_unread: boolean
          id: string
          image_url: string
          last_activity_at: string
          trip_group_id: string
          trip_id: string
        }[]
      }
      is_trip_member: { Args: { p_trip_id: string }; Returns: boolean }
      is_trip_organizer_or_co: { Args: { p_trip_id: string }; Returns: boolean }
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
