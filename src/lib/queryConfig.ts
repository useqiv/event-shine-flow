/**
 * Centralized React Query cache configuration
 * Reduces Supabase egress by applying appropriate staleTime/gcTime
 * to different data categories.
 */

// Time constants (in milliseconds)
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/**
 * Cache presets for different data volatility levels
 */
export const queryCache = {
  /**
   * Static data that rarely changes (roles, settings, categories)
   * staleTime: 30 minutes, gcTime: 1 hour
   */
  static: {
    staleTime: 30 * MINUTE,
    gcTime: HOUR,
    refetchOnWindowFocus: false,
  },

  /**
   * Semi-static data that changes infrequently (profiles, preferences)
   * staleTime: 10 minutes, gcTime: 30 minutes
   */
  semiStatic: {
    staleTime: 10 * MINUTE,
    gcTime: 30 * MINUTE,
    refetchOnWindowFocus: false,
  },

  /**
   * Moderate data that changes periodically (campaigns, events, contests)
   * staleTime: 5 minutes, gcTime: 15 minutes
   */
  moderate: {
    staleTime: 5 * MINUTE,
    gcTime: 15 * MINUTE,
  },

  /**
   * Dynamic data that changes frequently (votes, tickets, transactions)
   * staleTime: 1 minute, gcTime: 5 minutes
   */
  dynamic: {
    staleTime: MINUTE,
    gcTime: 5 * MINUTE,
  },

  /**
   * Real-time data that needs fresh updates (leaderboards, live stats)
   * No staleTime, short gcTime
   */
  realtime: {
    staleTime: 0,
    gcTime: MINUTE,
  },

  /**
   * Public listing data with moderate caching
   * staleTime: 3 minutes, gcTime: 10 minutes
   */
  publicListing: {
    staleTime: 3 * MINUTE,
    gcTime: 10 * MINUTE,
  },
} as const;

/**
 * Common column selections to reduce payload size
 * Use these instead of select('*') where possible
 */
export const selectColumns = {
  // Events - public listing (minimal columns for cards)
  eventCard: 'id, title, image_url, venue, event_date, category, is_featured, is_private, custom_slug, country, currency',
  
  // Events - full details
  eventDetail: 'id, title, description, image_url, venue, address, event_date, category, is_active, is_featured, is_private, custom_slug, currency, country, logo_url, stream_url, stream_platform, organization_id, created_at, updated_at',
  
  // Contests - public listing (includes all fields needed by Contest type)
  contestCard: 'id, title, description, image_url, category, vote_price, vote_currency, end_date, start_date, is_featured, custom_slug, is_active, total_votes, created_at, updated_at',
  
  // Contests - full details
  contestDetail: 'id, title, description, image_url, category, vote_price, vote_currency, start_date, end_date, is_active, is_featured, is_live_voting, total_votes, custom_slug, brand_logo_url, brand_primary_color, brand_secondary_color, stream_url, stream_platform, organization_id, contest_type, created_at, updated_at',
  
  // Contestants - public listing (includes all fields needed by Contestant type)
  contestantCard: 'id, name, photo_url, vote_count, contest_id, bio, category_id, performance, is_public_votes, created_at, updated_at',
  
  // Campaigns - public listing (includes creator_id for profile lookup)
  campaignCard: 'id, title, description, short_description, image_url, goal_amount, current_amount, currency, category, donor_count, status, is_featured, custom_slug, creator_id, start_date, end_date, created_at, updated_at',
  
  // Campaigns - full details
  campaignDetail: 'id, title, description, short_description, image_url, goal_amount, current_amount, currency, category, status, is_featured, start_date, end_date, donor_count, creator_id, custom_slug, created_at, updated_at',
  
  // Profile - essential fields
  profileEssential: 'id, full_name, avatar_url, email',
  
  // Profile - full details
  profileDetail: 'id, email, full_name, phone, avatar_url, account_type_selected, created_at, updated_at',
  
  // Ticket types - for purchase
  ticketType: 'id, event_id, name, description, price, currency, quantity_available, quantity_sold',
  
  // Notifications - list view
  notification: 'id, title, message, type, is_read, reference_id, created_at',
  
  // Wallet - essential
  walletEssential: 'id, balance, balance_currency, referral_code, low_balance_threshold',
  
  // User role
  userRole: 'role',
} as const;
