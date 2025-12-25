import React, { useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const REFERRAL_STORAGE_KEY = 'influencer_ref_code';
const REFERRAL_LINK_ID_KEY = 'influencer_link_id';
const REFERRAL_TIMESTAMP_KEY = 'influencer_ref_timestamp';

export const InfluencerTracker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
        if (timeSinceLastClick < 60 * 60 * 1000) {
          console.log('Skipping duplicate click tracking for code:', code);
          return;
        }
      }

      // Find the influencer link
      const { data: link, error: linkError } = await supabase
        .from('influencer_links')
        .select('id, organization_id, total_clicks')
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
      const ipHash = await hashString(Date.now().toString() + navigator.userAgent);
      
      const { error: clickError } = await supabase
        .from('influencer_clicks')
        .insert({
          link_id: link.id,
          user_agent: navigator.userAgent,
          ip_hash: ipHash,
          referrer: document.referrer || null,
        });

      if (clickError) {
        console.error('Error recording click:', clickError);
        return;
      }

      // Update the total clicks on the link
      await supabase
        .from('influencer_links')
        .update({ total_clicks: link.total_clicks + 1 })
        .eq('id', link.id);

      console.log('Tracked influencer click for code:', code);
    } catch (error) {
      console.error('Error tracking influencer click:', error);
    }
  };

  return <>{children}</>;
};

// Simple hash function for pseudonymization
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}
