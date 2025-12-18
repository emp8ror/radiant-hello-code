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
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          duration_months: number | null
          id: string
          metadata: Json | null
          method: string
          paid_on: string | null
          payment_expires_at: string | null
          property_id: string
          provider: string | null
          provider_ref: string | null
          status: string
          tenant_id: string
          unit_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          duration_months?: number | null
          id?: string
          metadata?: Json | null
          method?: string
          paid_on?: string | null
          payment_expires_at?: string | null
          property_id: string
          provider?: string | null
          provider_ref?: string | null
          status?: string
          tenant_id: string
          unit_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          duration_months?: number | null
          id?: string
          metadata?: Json | null
          method?: string
          paid_on?: string | null
          payment_expires_at?: string | null
          property_id?: string
          provider?: string | null
          provider_ref?: string | null
          status?: string
          tenant_id?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "unit_occupancy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          join_code: string | null
          owner_id: string
          region: string | null
          rent_amount: number
          rent_currency: string | null
          rent_due_day: number | null
          rent_due_interval: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          join_code?: string | null
          owner_id: string
          region?: string | null
          rent_amount: number
          rent_currency?: string | null
          rent_due_day?: number | null
          rent_due_interval?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          join_code?: string | null
          owner_id?: string
          region?: string | null
          rent_amount?: number
          rent_currency?: string | null
          rent_due_day?: number | null
          rent_due_interval?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          created_at: string | null
          filename: string | null
          id: string
          image_url: string
          is_cover: boolean | null
          metadata: Json | null
          property_id: string
        }
        Insert: {
          created_at?: string | null
          filename?: string | null
          id?: string
          image_url: string
          is_cover?: boolean | null
          metadata?: Json | null
          property_id: string
        }
        Update: {
          created_at?: string | null
          filename?: string | null
          id?: string
          image_url?: string
          is_cover?: boolean | null
          metadata?: Json | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      property_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          property_id: string
          rating: number
          tenant_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          property_id: string
          rating: number
          tenant_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          property_id?: string
          rating?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_properties: {
        Row: {
          created_at: string | null
          id: string
          invitation_message: string | null
          invited_by: string | null
          joined_at: string | null
          last_payment_date: string | null
          property_id: string
          status: string
          tenant_id: string
          unit_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invitation_message?: string | null
          invited_by?: string | null
          joined_at?: string | null
          last_payment_date?: string | null
          property_id: string
          status?: string
          tenant_id: string
          unit_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invitation_message?: string | null
          invited_by?: string | null
          joined_at?: string | null
          last_payment_date?: string | null
          property_id?: string
          status?: string
          tenant_id?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_properties_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_properties_tenant_id_user_profiles_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_properties_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "unit_occupancy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_properties_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_available: boolean | null
          label: string
          property_id: string
          rent_amount: number | null
          tenant_id: string | null
          unit_type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          label: string
          property_id: string
          rent_amount?: number | null
          tenant_id?: string | null
          unit_type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          label?: string
          property_id?: string
          rent_amount?: number | null
          tenant_id?: string | null
          unit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          metadata: Json | null
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          metadata?: Json | null
          phone?: string | null
          role?: string
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          metadata?: Json | null
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      property_ratings: {
        Row: {
          average_rating: number | null
          property_id: string | null
          review_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      property_summary: {
        Row: {
          address: string | null
          average_rating: number | null
          city: string | null
          country: string | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          join_code: string | null
          owner_id: string | null
          region: string | null
          rent_amount: number | null
          rent_currency: string | null
          rent_due_day: number | null
          rent_due_interval: string | null
          review_count: number | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_occupancy: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          is_available: boolean | null
          joined_at: string | null
          label: string | null
          last_payment_date: string | null
          property_id: string | null
          rent_amount: number | null
          tenant_id: string | null
          tenant_name: string | null
          tenant_phone: string | null
          tenant_status: string | null
          unit_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_summary"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      mark_payment_as_paid: {
        Args: {
          _metadata?: Json
          _paid_on?: string
          _payment_id: string
          _provider_ref: string
        }
        Returns: undefined
      }
      request_join_property_by_code: {
        Args: {
          _message?: string
          _property_code: string
          _tenant: string
          _unit_id?: string
        }
        Returns: string
      }
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
