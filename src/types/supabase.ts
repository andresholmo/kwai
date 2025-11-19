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
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: "admin" | "user" | "viewer";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "admin" | "user" | "viewer";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "admin" | "user" | "viewer";
          created_at?: string;
          updated_at?: string;
        };
      };
      kwai_tokens: {
        Row: {
          id: string;
          user_id: string;
          access_token: string;
          refresh_token: string;
          token_type: string;
          expires_in: number;
          expires_at: string;
          scope: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          access_token: string;
          refresh_token: string;
          token_type?: string;
          expires_in: number;
          expires_at: string;
          scope: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          access_token?: string;
          refresh_token?: string;
          token_type?: string;
          expires_in?: number;
          expires_at?: string;
          scope?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      kwai_accounts: {
        Row: {
          id: string;
          user_id: string;
          account_id: number;
          account_name: string;
          account_type: "advertiser" | "agency" | null;
          timezone: string;
          currency: string;
          status: "active" | "paused" | "deleted";
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: number;
          account_name: string;
          account_type?: "advertiser" | "agency" | null;
          timezone?: string;
          currency?: string;
          status?: "active" | "paused" | "deleted";
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: number;
          account_name?: string;
          account_type?: "advertiser" | "agency" | null;
          timezone?: string;
          currency?: string;
          status?: "active" | "paused" | "deleted";
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          kwai_campaign_id: number | null;
          name: string;
          objective: string;
          status: "draft" | "active" | "paused" | "deleted" | "pending_review";
          budget_type: "daily" | "lifetime" | null;
          budget: number | null;
          start_date: string | null;
          end_date: string | null;
          kwai_data: Json | null;
          created_at: string;
          updated_at: string;
          synced_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          kwai_campaign_id?: number | null;
          name: string;
          objective: string;
          status?: "draft" | "active" | "paused" | "deleted" | "pending_review";
          budget_type?: "daily" | "lifetime" | null;
          budget?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          kwai_data?: Json | null;
          created_at?: string;
          updated_at?: string;
          synced_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          kwai_campaign_id?: number | null;
          name?: string;
          objective?: string;
          status?: "draft" | "active" | "paused" | "deleted" | "pending_review";
          budget_type?: "daily" | "lifetime" | null;
          budget?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          kwai_data?: Json | null;
          created_at?: string;
          updated_at?: string;
          synced_at?: string | null;
        };
      };
      ad_sets: {
        Row: {
          id: string;
          user_id: string;
          campaign_id: string;
          kwai_ad_set_id: number | null;
          name: string;
          status: "draft" | "active" | "paused" | "deleted" | "pending_review";
          countries: Json | null;
          age_groups: Json | null;
          genders: Json | null;
          languages: Json | null;
          device_prices: Json | null;
          operating_systems: Json | null;
          interests: Json | null;
          budget_type: "daily" | "lifetime" | null;
          budget: number | null;
          bid_strategy: "TARGET_COST" | "LOWEST_COST" | "COST_CAP" | null;
          bid_amount: number | null;
          optimization_goal: string | null;
          placement: Json | null;
          start_time: string | null;
          end_time: string | null;
          kwai_data: Json | null;
          created_at: string;
          updated_at: string;
          synced_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          campaign_id: string;
          kwai_ad_set_id?: number | null;
          name: string;
          status?: "draft" | "active" | "paused" | "deleted" | "pending_review";
          countries?: Json | null;
          age_groups?: Json | null;
          genders?: Json | null;
          languages?: Json | null;
          device_prices?: Json | null;
          operating_systems?: Json | null;
          interests?: Json | null;
          budget_type?: "daily" | "lifetime" | null;
          budget?: number | null;
          bid_strategy?: "TARGET_COST" | "LOWEST_COST" | "COST_CAP" | null;
          bid_amount?: number | null;
          optimization_goal?: string | null;
          placement?: Json | null;
          start_time?: string | null;
          end_time?: string | null;
          kwai_data?: Json | null;
          created_at?: string;
          updated_at?: string;
          synced_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          campaign_id?: string;
          kwai_ad_set_id?: number | null;
          name?: string;
          status?: "draft" | "active" | "paused" | "deleted" | "pending_review";
          countries?: Json | null;
          age_groups?: Json | null;
          genders?: Json | null;
          languages?: Json | null;
          device_prices?: Json | null;
          operating_systems?: Json | null;
          interests?: Json | null;
          budget_type?: "daily" | "lifetime" | null;
          budget?: number | null;
          bid_strategy?: "TARGET_COST" | "LOWEST_COST" | "COST_CAP" | null;
          bid_amount?: number | null;
          optimization_goal?: string | null;
          placement?: Json | null;
          start_time?: string | null;
          end_time?: string | null;
          kwai_data?: Json | null;
          created_at?: string;
          updated_at?: string;
          synced_at?: string | null;
        };
      };
      creatives: {
        Row: {
          id: string;
          user_id: string;
          ad_set_id: string;
          kwai_creative_id: number | null;
          name: string;
          status: "draft" | "active" | "paused" | "deleted" | "pending_review" | "rejected";
          title: string | null;
          description: string | null;
          call_to_action: string | null;
          video_id: string | null;
          thumbnail_url: string | null;
          landing_page_url: string | null;
          app_id: string | null;
          review_status: string | null;
          review_message: string | null;
          kwai_data: Json | null;
          created_at: string;
          updated_at: string;
          synced_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          ad_set_id: string;
          kwai_creative_id?: number | null;
          name: string;
          status?: "draft" | "active" | "paused" | "deleted" | "pending_review" | "rejected";
          title?: string | null;
          description?: string | null;
          call_to_action?: string | null;
          video_id?: string | null;
          thumbnail_url?: string | null;
          landing_page_url?: string | null;
          app_id?: string | null;
          review_status?: string | null;
          review_message?: string | null;
          kwai_data?: Json | null;
          created_at?: string;
          updated_at?: string;
          synced_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          ad_set_id?: string;
          kwai_creative_id?: number | null;
          name?: string;
          status?: "draft" | "active" | "paused" | "deleted" | "pending_review" | "rejected";
          title?: string | null;
          description?: string | null;
          call_to_action?: string | null;
          video_id?: string | null;
          thumbnail_url?: string | null;
          landing_page_url?: string | null;
          app_id?: string | null;
          review_status?: string | null;
          review_message?: string | null;
          kwai_data?: Json | null;
          created_at?: string;
          updated_at?: string;
          synced_at?: string | null;
        };
      };
      materials: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          kwai_material_id: number | null;
          material_type: "video" | "image" | "app" | "avatar" | "playable";
          name: string;
          url: string | null;
          thumbnail_url: string | null;
          duration: number | null;
          width: number | null;
          height: number | null;
          file_size: number | null;
          format: string | null;
          app_name: string | null;
          package_name: string | null;
          platform: string | null;
          status: "active" | "processing" | "failed" | "deleted";
          kwai_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          kwai_material_id?: number | null;
          material_type: "video" | "image" | "app" | "avatar" | "playable";
          name: string;
          url?: string | null;
          thumbnail_url?: string | null;
          duration?: number | null;
          width?: number | null;
          height?: number | null;
          file_size?: number | null;
          format?: string | null;
          app_name?: string | null;
          package_name?: string | null;
          platform?: string | null;
          status?: "active" | "processing" | "failed" | "deleted";
          kwai_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          kwai_material_id?: number | null;
          material_type?: "video" | "image" | "app" | "avatar" | "playable";
          name?: string;
          url?: string | null;
          thumbnail_url?: string | null;
          duration?: number | null;
          width?: number | null;
          height?: number | null;
          file_size?: number | null;
          format?: string | null;
          app_name?: string | null;
          package_name?: string | null;
          platform?: string | null;
          status?: "active" | "processing" | "failed" | "deleted";
          kwai_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      campaign_stats: {
        Row: {
          id: string;
          campaign_id: string;
          date: string;
          impressions: number;
          clicks: number;
          cost: number;
          conversions: number;
          ctr: number | null;
          cpc: number | null;
          cpa: number | null;
          country_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          date: string;
          impressions?: number;
          clicks?: number;
          cost?: number;
          conversions?: number;
          ctr?: number | null;
          cpc?: number | null;
          cpa?: number | null;
          country_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          date?: string;
          impressions?: number;
          clicks?: number;
          cost?: number;
          conversions?: number;
          ctr?: number | null;
          cpc?: number | null;
          cpa?: number | null;
          country_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      api_logs: {
        Row: {
          id: string;
          user_id: string | null;
          endpoint: string;
          method: string;
          status_code: number | null;
          request_body: Json | null;
          response_body: Json | null;
          error_message: string | null;
          duration_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          endpoint: string;
          method: string;
          status_code?: number | null;
          request_body?: Json | null;
          response_body?: Json | null;
          error_message?: string | null;
          duration_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          endpoint?: string;
          method?: string;
          status_code?: number | null;
          request_body?: Json | null;
          response_body?: Json | null;
          error_message?: string | null;
          duration_ms?: number | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

