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
          // Eligibility & context (additive columns — safe to fallback if not yet in DB)
          is_post_secondary: boolean | null;
          is_newcomer: boolean | null;
          is_indigenous: boolean | null;
          has_emergency_savings: boolean | null;
          has_dependent: boolean | null;
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
          is_post_secondary?: boolean | null;
          is_newcomer?: boolean | null;
          is_indigenous?: boolean | null;
          has_emergency_savings?: boolean | null;
          has_dependent?: boolean | null;
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
          is_post_secondary?: boolean | null;
          is_newcomer?: boolean | null;
          is_indigenous?: boolean | null;
          has_emergency_savings?: boolean | null;
          has_dependent?: boolean | null;
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
      extension_decisions: {
        Row: {
          id: string;
          user_id: string | null;
          merchant: string;
          page_title: string;
          page_url: string;
          recommendation: string;
          purchase_amount: number;
          detected_category: string;
          deadline_risk: string;
          goal_impact: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          merchant: string;
          page_title: string;
          page_url: string;
          recommendation: string;
          purchase_amount: number;
          detected_category: string;
          deadline_risk: string;
          goal_impact: string;
          created_at?: string;
        };
        Update: {
          user_id?: string | null;
          merchant?: string;
          page_title?: string;
          page_url?: string;
          recommendation?: string;
          purchase_amount?: number;
          detected_category?: string;
          deadline_risk?: string;
          goal_impact?: string;
          created_at?: string;
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
