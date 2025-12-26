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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          description: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_moderation: {
        Row: {
          content_type: string
          content_url: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_by: string
          updated_at: string
        }
        Insert: {
          content_type: string
          content_url: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by: string
          updated_at?: string
        }
        Update: {
          content_type?: string
          content_url?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_moderation_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_moderation_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_analytics: {
        Row: {
          contest_id: string
          created_at: string
          date: string
          hour: number | null
          id: string
          unique_voters: number
          votes_count: number
          votes_revenue: number
        }
        Insert: {
          contest_id: string
          created_at?: string
          date?: string
          hour?: number | null
          id?: string
          unique_voters?: number
          votes_count?: number
          votes_revenue?: number
        }
        Update: {
          contest_id?: string
          created_at?: string
          date?: string
          hour?: number | null
          id?: string
          unique_voters?: number
          votes_count?: number
          votes_revenue?: number
        }
        Relationships: [
          {
            foreignKeyName: "contest_analytics_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_auto_posts: {
        Row: {
          contest_id: string
          created_at: string
          custom_message: string | null
          id: string
          is_active: boolean
          last_posted_at: string | null
          next_post_at: string | null
          organization_id: string
          platform: string
          post_type: string
          schedule_interval: string
          updated_at: string
        }
        Insert: {
          contest_id: string
          created_at?: string
          custom_message?: string | null
          id?: string
          is_active?: boolean
          last_posted_at?: string | null
          next_post_at?: string | null
          organization_id: string
          platform?: string
          post_type?: string
          schedule_interval?: string
          updated_at?: string
        }
        Update: {
          contest_id?: string
          created_at?: string
          custom_message?: string | null
          id?: string
          is_active?: boolean
          last_posted_at?: string | null
          next_post_at?: string | null
          organization_id?: string
          platform?: string
          post_type?: string
          schedule_interval?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_auto_posts_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contestants: {
        Row: {
          bio: string | null
          contest_id: string
          created_at: string
          display_order: number | null
          id: string
          is_public_votes: boolean
          name: string
          performance: string | null
          photo_url: string | null
          updated_at: string
          vote_count: number
        }
        Insert: {
          bio?: string | null
          contest_id: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_public_votes?: boolean
          name: string
          performance?: string | null
          photo_url?: string | null
          updated_at?: string
          vote_count?: number
        }
        Update: {
          bio?: string | null
          contest_id?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_public_votes?: boolean
          name?: string
          performance?: string | null
          photo_url?: string | null
          updated_at?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "contestants_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contests: {
        Row: {
          brand_logo_url: string | null
          brand_primary_color: string | null
          brand_secondary_color: string | null
          category: string
          created_at: string
          custom_slug: string | null
          description: string | null
          end_date: string
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          organization_id: string | null
          start_date: string
          title: string
          total_votes: number
          updated_at: string
          vote_currency: string
          vote_price: number
        }
        Insert: {
          brand_logo_url?: string | null
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          category: string
          created_at?: string
          custom_slug?: string | null
          description?: string | null
          end_date: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          organization_id?: string | null
          start_date: string
          title: string
          total_votes?: number
          updated_at?: string
          vote_currency?: string
          vote_price?: number
        }
        Update: {
          brand_logo_url?: string | null
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          category?: string
          created_at?: string
          custom_slug?: string | null
          description?: string | null
          end_date?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          organization_id?: string | null
          start_date?: string
          title?: string
          total_votes?: number
          updated_at?: string
          vote_currency?: string
          vote_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "contests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_auto_posts: {
        Row: {
          created_at: string
          custom_message: string | null
          event_id: string
          id: string
          is_active: boolean
          last_posted_at: string | null
          next_post_at: string | null
          organization_id: string
          platform: string
          post_type: string
          schedule_interval: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_message?: string | null
          event_id: string
          id?: string
          is_active?: boolean
          last_posted_at?: string | null
          next_post_at?: string | null
          organization_id: string
          platform?: string
          post_type?: string
          schedule_interval?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_message?: string | null
          event_id?: string
          id?: string
          is_active?: boolean
          last_posted_at?: string | null
          next_post_at?: string | null
          organization_id?: string
          platform?: string
          post_type?: string
          schedule_interval?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_auto_posts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_auto_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          category: string
          created_at: string
          description: string | null
          event_date: string
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          organization_id: string | null
          title: string
          updated_at: string
          venue: string
        }
        Insert: {
          address?: string | null
          category: string
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          organization_id?: string | null
          title: string
          updated_at?: string
          venue: string
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          organization_id?: string | null
          title?: string
          updated_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          description: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_clicks: {
        Row: {
          clicked_at: string
          conversion_amount: number | null
          converted: boolean
          converted_at: string | null
          id: string
          ip_hash: string | null
          link_id: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string
          conversion_amount?: number | null
          converted?: boolean
          converted_at?: string | null
          id?: string
          ip_hash?: string | null
          link_id: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string
          conversion_amount?: number | null
          converted?: boolean
          converted_at?: string | null
          id?: string
          ip_hash?: string | null
          link_id?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "influencer_links"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_links: {
        Row: {
          code: string
          commission_type: string
          commission_value: number
          contest_id: string | null
          created_at: string
          event_id: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          total_clicks: number
          total_commission: number
          total_conversions: number
          total_revenue: number
          updated_at: string
        }
        Insert: {
          code: string
          commission_type?: string
          commission_value?: number
          contest_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          total_clicks?: number
          total_commission?: number
          total_conversions?: number
          total_revenue?: number
          updated_at?: string
        }
        Update: {
          code?: string
          commission_type?: string
          commission_value?: number
          contest_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          total_clicks?: number
          total_commission?: number
          total_conversions?: number
          total_revenue?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencer_links_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          reference_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_approvals: {
        Row: {
          blacklist_reason: string | null
          blacklisted_at: string | null
          created_at: string
          id: string
          is_blacklisted: boolean
          organization_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          special_commission_rate: number | null
          status: string
          updated_at: string
        }
        Insert: {
          blacklist_reason?: string | null
          blacklisted_at?: string | null
          created_at?: string
          id?: string
          is_blacklisted?: boolean
          organization_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          special_commission_rate?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          blacklist_reason?: string | null
          blacklisted_at?: string | null
          created_at?: string
          id?: string
          is_blacklisted?: boolean
          organization_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          special_commission_rate?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_approvals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_approvals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          account_name: string | null
          account_number: string | null
          bank_name: string | null
          company_address: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string
          id: string
          organization_id: string
          preferred_payout_method: string | null
          updated_at: string
          usdt_address: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          id?: string
          organization_id: string
          preferred_payout_method?: string | null
          updated_at?: string
          usdt_address?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          preferred_payout_method?: string | null
          updated_at?: string
          usdt_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          account_name: string | null
          account_number: string | null
          amount: number
          bank_name: string | null
          created_at: string
          id: string
          organization_id: string
          payment_method: string
          processed_at: string | null
          reference_id: string | null
          status: string
          updated_at: string
          usdt_address: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          amount: number
          bank_name?: string | null
          created_at?: string
          id?: string
          organization_id: string
          payment_method?: string
          processed_at?: string | null
          reference_id?: string | null
          status?: string
          updated_at?: string
          usdt_address?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          amount?: number
          bank_name?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          payment_method?: string
          processed_at?: string | null
          reference_id?: string | null
          status?: string
          updated_at?: string
          usdt_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_type: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type_selected: boolean
          avatar_url: string | null
          created_at: string
          email: string | null
          fraud_score: number
          full_name: string | null
          id: string
          is_suspended: boolean
          phone: string | null
          suspended_at: string | null
          suspended_reason: string | null
          updated_at: string
        }
        Insert: {
          account_type_selected?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          fraud_score?: number
          full_name?: string | null
          id: string
          is_suspended?: boolean
          phone?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
        }
        Update: {
          account_type_selected?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          fraud_score?: number
          full_name?: string | null
          id?: string
          is_suspended?: boolean
          phone?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          applicable_to: string
          code: string
          contest_id: string | null
          created_at: string
          current_uses: number
          discount_type: string
          discount_value: number
          event_id: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          organization_id: string
          ticket_type_id: string | null
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          applicable_to?: string
          code: string
          contest_id?: string | null
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value: number
          event_id?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          organization_id: string
          ticket_type_id?: string | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          applicable_to?: string
          code?: string
          contest_id?: string | null
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value?: number
          event_id?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          organization_id?: string
          ticket_type_id?: string | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_codes_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_scan_logs: {
        Row: {
          event_id: string
          id: string
          scan_result: string
          scanned_at: string
          scanned_by: string | null
          ticket_id: string
        }
        Insert: {
          event_id: string
          id?: string
          scan_result?: string
          scanned_at?: string
          scanned_by?: string | null
          ticket_id: string
        }
        Update: {
          event_id?: string
          id?: string
          scan_result?: string
          scanned_at?: string
          scanned_by?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_scan_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_scan_logs_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_scan_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          original_transaction_id: string
          original_transaction_type: string
          processed_at: string | null
          processed_by: string | null
          reason: string
          rejection_reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          original_transaction_id: string
          original_transaction_type: string
          processed_at?: string | null
          processed_by?: string | null
          reason: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          original_transaction_id?: string
          original_transaction_type?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      social_post_logs: {
        Row: {
          content: string | null
          contest_id: string
          engagement_clicks: number | null
          engagement_impressions: number | null
          error_message: string | null
          id: string
          organization_id: string
          platform: string
          post_type: string
          posted_at: string
          status: string
        }
        Insert: {
          content?: string | null
          contest_id: string
          engagement_clicks?: number | null
          engagement_impressions?: number | null
          error_message?: string | null
          id?: string
          organization_id: string
          platform: string
          post_type: string
          posted_at?: string
          status?: string
        }
        Update: {
          content?: string | null
          contest_id?: string
          engagement_clicks?: number | null
          engagement_impressions?: number | null
          error_message?: string | null
          id?: string
          organization_id?: string
          platform?: string
          post_type?: string
          posted_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_post_logs_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_staff_reply: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_staff_reply?: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_staff_reply?: boolean
          message?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invited_at: string
          name: string | null
          organization_id: string
          permissions: Json | null
          role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invited_at?: string
          name?: string | null
          organization_id: string
          permissions?: Json | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_at?: string
          name?: string | null
          organization_id?: string
          permissions?: Json | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_transfers: {
        Row: {
          completed_at: string | null
          created_at: string
          expires_at: string
          from_user_id: string
          id: string
          status: string
          ticket_id: string
          to_user_email: string
          to_user_id: string
          transfer_code: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          from_user_id: string
          id?: string
          status?: string
          ticket_id: string
          to_user_email: string
          to_user_id: string
          transfer_code: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          from_user_id?: string
          id?: string
          status?: string
          ticket_id?: string
          to_user_email?: string
          to_user_id?: string
          transfer_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_transfers_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_types: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          name: string
          price: number
          quantity_available: number
          quantity_sold: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          name: string
          price: number
          quantity_available: number
          quantity_sold?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          name?: string
          price?: number
          quantity_available?: number
          quantity_sold?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          amount_paid: number
          created_at: string
          event_id: string
          id: string
          payment_method: string
          qr_code: string
          quantity: number
          status: string
          ticket_type_id: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          event_id: string
          id?: string
          payment_method: string
          qr_code: string
          quantity?: number
          status?: string
          ticket_type_id: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          event_id?: string
          id?: string
          payment_method?: string
          qr_code?: string
          quantity?: number
          status?: string
          ticket_type_id?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          amount_paid: number
          contest_id: string
          contestant_id: string
          created_at: string
          id: string
          payment_method: string
          quantity: number
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          contest_id: string
          contestant_id: string
          created_at?: string
          id?: string
          payment_method: string
          quantity?: number
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          contest_id?: string
          contestant_id?: string
          created_at?: string
          id?: string
          payment_method?: string
          quantity?: number
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_contestant_id_fkey"
            columns: ["contestant_id"]
            isOneToOne: false
            referencedRelation: "contestants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          amount: number
          code: string
          created_at: string
          expires_at: string | null
          id: string
          is_used: boolean
          used_by: string | null
        }
        Insert: {
          amount: number
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean
          used_by?: string | null
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean
          used_by?: string | null
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          status: string
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: string
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: string
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          referral_code: string | null
          referral_earnings: number
          referred_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          referral_code?: string | null
          referral_earnings?: number
          referred_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          referral_code?: string | null
          referral_earnings?: number
          referred_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_statistics: { Args: never; Returns: Json }
      get_referral_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
          avatar_url: string
          display_name: string
          referral_count: number
          total_earnings: number
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "organization"
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
    Enums: {
      app_role: ["admin", "moderator", "user", "organization"],
    },
  },
} as const
