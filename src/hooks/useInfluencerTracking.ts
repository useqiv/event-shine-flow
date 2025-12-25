import { useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const REFERRAL_STORAGE_KEY = 'influencer_ref_code';
const REFERRAL_LINK_ID_KEY = 'influencer_link_id';
const REFERRAL_TIMESTAMP_KEY = 'influencer_ref_timestamp';
const REFERRAL_EXPIRY_DAYS = 30;

export const useInfluencerTracking = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    
    if (refCode) {
      trackClick(refCode);
    }
  }, [searchParams, location.pathname]);

  const trackClick = async (code: string) => {
    try {
      // Check if we already tracked this click recently (within 1 hour)
      const lastClickTime = localStorage.getItem(`ref_clicked_${code}`);
      if (lastClickTime) {
        const timeSinceLastClick = Date.now() - parseInt(lastClickTime);
        if (timeSinceLastClick < 60 * 60 * 1000) { // 1 hour
          console.log('Skipping duplicate click tracking for code:', code);
          return;
        }
      }

      // Find the influencer link
      const { data: link, error: linkError } = await supabase
        .from('influencer_links')
        .select('id, organization_id')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (linkError || !link) {
        console.log('Influencer link not found:', code);
        return;
      }

      // Store the referral info for conversion tracking
      localStorage.setItem(REFERRAL_STORAGE_KEY, code.toUpperCase());
      localStorage.setItem(REFERRAL_LINK_ID_KEY, link.id);
      localStorage.setItem(REFERRAL_TIMESTAMP_KEY, Date.now().toString());
      localStorage.setItem(`ref_clicked_${code}`, Date.now().toString());

      // Record the click
      const { error: clickError } = await supabase
        .from('influencer_clicks')
        .insert({
          link_id: link.id,
          user_agent: navigator.userAgent,
          ip_hash: await hashString(Date.now().toString() + navigator.userAgent), // Pseudonymized
          referrer: document.referrer || null,
        });

      if (clickError) {
        console.error('Error recording click:', clickError);
        return;
      }

      // Update the total clicks on the link
      const { data: currentLink } = await supabase
        .from('influencer_links')
        .select('total_clicks')
        .eq('id', link.id)
        .single();

      if (currentLink) {
        await supabase
          .from('influencer_links')
          .update({ total_clicks: currentLink.total_clicks + 1 })
          .eq('id', link.id);
      }

      console.log('Tracked influencer click for code:', code);
    } catch (error) {
      console.error('Error tracking influencer click:', error);
    }
  };

  return {
    getStoredReferral: () => {
      const code = localStorage.getItem(REFERRAL_STORAGE_KEY);
      const linkId = localStorage.getItem(REFERRAL_LINK_ID_KEY);
      const timestamp = localStorage.getItem(REFERRAL_TIMESTAMP_KEY);

      if (!code || !linkId || !timestamp) return null;

      // Check if referral has expired
      const age = Date.now() - parseInt(timestamp);
      const expiryMs = REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      
      if (age > expiryMs) {
        clearStoredReferral();
        return null;
      }

      return { code, linkId };
    },
    clearStoredReferral: () => {
      localStorage.removeItem(REFERRAL_STORAGE_KEY);
      localStorage.removeItem(REFERRAL_LINK_ID_KEY);
      localStorage.removeItem(REFERRAL_TIMESTAMP_KEY);
    },
  };
};

const clearStoredReferral = () => {
  localStorage.removeItem(REFERRAL_STORAGE_KEY);
  localStorage.removeItem(REFERRAL_LINK_ID_KEY);
  localStorage.removeItem(REFERRAL_TIMESTAMP_KEY);
};

// Simple hash function for pseudonymization
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

// Hook to record a conversion
export const useRecordConversion = () => {
  const recordConversion = async (amount: number) => {
    const linkId = localStorage.getItem(REFERRAL_LINK_ID_KEY);
    
    if (!linkId) {
      console.log('No referral to attribute conversion to');
      return;
    }

    try {
      // Get the link to calculate commission
      const { data: link, error: linkError } = await supabase
        .from('influencer_links')
        .select('*')
        .eq('id', linkId)
        .single();

      if (linkError || !link) {
        console.error('Could not find influencer link:', linkError);
        return;
      }

      // Calculate commission
      let commission = 0;
      if (link.commission_type === 'percentage') {
        commission = (amount * link.commission_value) / 100;
      } else {
        commission = link.commission_value;
      }

      // Find the most recent untracked click for this link
      const { data: clicks, error: clickError } = await supabase
        .from('influencer_clicks')
        .select('id')
        .eq('link_id', linkId)
        .eq('converted', false)
        .order('clicked_at', { ascending: false })
        .limit(1);

      if (clicks && clicks.length > 0) {
        // Update the click as converted
        await supabase
          .from('influencer_clicks')
          .update({
            converted: true,
            conversion_amount: amount,
            converted_at: new Date().toISOString(),
          })
          .eq('id', clicks[0].id);
      }

      // Update link totals
      await supabase
        .from('influencer_links')
        .update({
          total_conversions: link.total_conversions + 1,
          total_revenue: link.total_revenue + amount,
          total_commission: link.total_commission + commission,
        })
        .eq('id', linkId);

      console.log('Recorded conversion:', { amount, commission, linkId });

      // Clear the stored referral after successful conversion
      clearStoredReferral();

    } catch (error) {
      console.error('Error recording conversion:', error);
    }
  };

  return { recordConversion };
};
