/**
 * Supabase database types.
 * Re-generate this file by running: npx supabase gen types typescript --local
 *
 * For now these are minimal stubs — extend as tables are added to the schema.
 */
export type Database = {
  public: {
    Tables: {
      trips: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          start_date: string | null;
          end_date: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trips']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['trips']['Insert']>;
      };
      trip_members: {
        Row: {
          id: string;
          trip_id: string;
          user_id: string;
          role: 'owner' | 'member';
          joined_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trip_members']['Row'], 'id' | 'joined_at'>;
        Update: Partial<Database['public']['Tables']['trip_members']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          trip_id: string;
          title: string;
          description: string | null;
          date: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          trip_id: string;
          title: string;
          completed: boolean;
          assigned_to: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          trip_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
