export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          user_id: string;
          age: string | null;
          province: string | null;
          employed: boolean;
          student: boolean;
          renter: boolean;
          has_car: boolean;
          has_debt: boolean;
          lives_with_parents: boolean;
          files_taxes: boolean;
          no_employer_benefits: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          age?: string | null;
          province?: string | null;
          employed?: boolean;
          student?: boolean;
          renter?: boolean;
          has_car?: boolean;
          has_debt?: boolean;
          lives_with_parents?: boolean;
          files_taxes?: boolean;
          no_employer_benefits?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          age?: string | null;
          province?: string | null;
          employed?: boolean;
          student?: boolean;
          renter?: boolean;
          has_car?: boolean;
          has_debt?: boolean;
          lives_with_parents?: boolean;
          files_taxes?: boolean;
          no_employer_benefits?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_actions: {
        Row: {
          user_id: string;
          action_id: string;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          action_id: string;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
