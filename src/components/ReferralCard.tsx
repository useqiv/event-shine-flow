import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { Copy, Share2, Users, Gift, Check, Trophy } from 'lucide-react';

const ReferralCard = () => {
  const { data: wallet } = useWallet();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralLink = wallet?.referral_code 
    ? `${window.location.origin}/auth?ref=${wallet.referral_code}`
    : '';

  const handleCopy = async () => {
    if (!referralLink) return;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Referral link copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleShare = async () => {
    if (!referralLink) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join USEQIV',
          text: 'Join USEQIV and get bonus points! Use my referral link:',
          url: referralLink,
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Refer & Earn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Share your referral link with friends. When they sign up and make their first transaction, you both earn ₦500 bonus!
        </p>
        
        <div className="flex gap-2">
          <Input 
            value={referralLink} 
            readOnly 
            className="font-mono text-sm"
            placeholder="Loading..."
          />
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleCopy}
            disabled={!wallet?.referral_code}
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleShare} className="flex-1" disabled={!wallet?.referral_code}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Link
          </Button>
          <Button variant="outline" asChild>
            <Link to="/leaderboard">
              <Trophy className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              ₦{wallet?.referral_earnings?.toLocaleString() || '0'}
            </p>
            <p className="text-xs text-muted-foreground">Total Earnings</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Gift className="h-4 w-4 text-accent" />
              <span className="text-2xl font-bold">₦500</span>
            </div>
            <p className="text-xs text-muted-foreground">Per Referral</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralCard;
