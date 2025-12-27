import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCampaign, useCampaignDonations, useCreateDonation } from '@/hooks/useCampaigns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Heart, Users, Target, Clock, Share2, ArrowLeft, User, MessageSquare, Wallet } from 'lucide-react';
import SocialShareButtons from '@/components/SocialShareButtons';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import CampaignUpdatesManager from '@/components/org/CampaignUpdatesManager';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DONATION_AMOUNTS = [10, 25, 50, 100, 250, 500];

const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: campaign, isLoading } = useCampaign(id!);
  const { data: donations } = useCampaignDonations(id!);
  const createDonation = useCreateDonation();
  
  const isOwner = user && campaign?.creator_id === user.id;
  
  const [donationAmount, setDonationAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [showDonateDialog, setShowDonateDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-80 rounded-lg" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div>
              <Skeleton className="h-96 rounded-lg" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Campaign not found</h1>
          <p className="text-muted-foreground mb-4">This campaign may have been removed or doesn't exist.</p>
          <Button asChild>
            <Link to="/campaigns">Browse Campaigns</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const progress = campaign.goal_amount > 0 
    ? Math.min((campaign.current_amount / campaign.goal_amount) * 100, 100) 
    : 0;
  
  const isEnded = campaign.end_date && isPast(new Date(campaign.end_date));
  const timeLeft = campaign.end_date 
    ? formatDistanceToNow(new Date(campaign.end_date), { addSuffix: true })
    : null;

  const handleDonate = async () => {
    if (!user) {
      toast.error('Please sign in to donate');
      return;
    }

    const amount = customAmount ? parseFloat(customAmount) : donationAmount;
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const donationResult = await createDonation.mutateAsync({
        campaign_id: campaign.id,
        amount,
        currency: campaign.currency,
        payment_method: 'wallet',
        is_anonymous: isAnonymous,
        donor_message: message || undefined,
      });
      
      // Send donation receipt email
      if (profile?.email) {
        try {
          await supabase.functions.invoke('send-donation-receipt', {
            body: {
              donationId: donationResult.id,
              donorEmail: profile.email,
              donorName: profile.full_name || 'Supporter',
              campaignTitle: campaign.title,
              amount,
              currency: campaign.currency,
              donationDate: new Date().toISOString(),
              isAnonymous,
            },
          });
        } catch (emailError) {
          console.error('Failed to send receipt email:', emailError);
          // Don't fail the donation if email fails
        }
      }
      
      setShowDonateDialog(false);
      setCustomAmount('');
      setMessage('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: campaign.title,
        text: campaign.short_description || campaign.description || '',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const pageUrl = `${window.location.origin}/campaigns/${campaign.id}`;
  const ogImage = campaign.image_url || `${window.location.origin}/placeholder.svg`;
  const ogDescription = campaign.short_description || campaign.description?.substring(0, 160) || `Support ${campaign.title} - Help us reach our goal of ${campaign.currency} ${Number(campaign.goal_amount).toLocaleString()}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{campaign.title} | Fundraising Campaign</title>
        <meta name="description" content={ogDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={campaign.title} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={pageUrl} />
        <meta name="twitter:title" content={campaign.title} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
        
        {/* Campaign specific meta */}
        <meta property="og:site_name" content="VoteWaves Campaigns" />
        <link rel="canonical" href={pageUrl} />
      </Helmet>

      <Navbar />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/campaigns">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Link>
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image */}
              <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
                {campaign.image_url ? (
                  <img 
                    src={campaign.image_url} 
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Heart className="h-24 w-24 text-muted-foreground/30" />
                  </div>
                )}
                <Badge className="absolute top-4 left-4">{campaign.category}</Badge>
              </div>

              {/* Title & Creator */}
              <div>
                <h1 className="text-3xl font-bold mb-2">{campaign.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={campaign.creator?.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span>by {campaign.creator?.full_name || 'Anonymous'}</span>
                </div>
              </div>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>About this campaign</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    {campaign.description || campaign.short_description || 'No description provided.'}
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Updates */}
              <Card>
                <CardContent className="pt-6">
                  <CampaignUpdatesManager campaignId={id!} isOwner={!!isOwner} />
                </CardContent>
              </Card>

              {/* Recent Donations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Recent Donations ({donations?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {donations && donations.length > 0 ? (
                    <div className="space-y-4">
                      {donations.slice(0, 10).map(donation => (
                        <div key={donation.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                          <Avatar>
                            {donation.is_anonymous ? (
                              <AvatarFallback>?</AvatarFallback>
                            ) : (
                              <>
                                <AvatarImage src={donation.donor?.avatar_url || undefined} />
                                <AvatarFallback>
                                  {donation.donor?.full_name?.[0] || 'A'}
                                </AvatarFallback>
                              </>
                            )}
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {donation.is_anonymous ? 'Anonymous' : donation.donor?.full_name || 'Anonymous'}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(donation.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-primary font-semibold">
                              {donation.currency} {Number(donation.amount).toLocaleString()}
                            </p>
                            {donation.donor_message && (
                              <p className="text-sm text-muted-foreground mt-1">
                                "{donation.donor_message}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Be the first to donate to this campaign!
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Donation Card */}
              <Card className="sticky top-4">
                <CardContent className="pt-6 space-y-6">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-2xl font-bold">
                        {campaign.currency} {Number(campaign.current_amount).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-2">
                      raised of {campaign.currency} {Number(campaign.goal_amount).toLocaleString()} goal
                    </p>
                    <Progress value={progress} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {progress.toFixed(0)}% funded
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="font-bold">{campaign.donor_count}</p>
                      <p className="text-xs text-muted-foreground">donors</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="font-bold text-sm">{isEnded ? 'Ended' : timeLeft || 'No deadline'}</p>
                      <p className="text-xs text-muted-foreground">
                        {campaign.end_date ? format(new Date(campaign.end_date), 'MMM d, yyyy') : 'Ongoing'}
                      </p>
                    </div>
                  </div>

                  {/* Donate Button */}
                  <Dialog open={showDonateDialog} onOpenChange={setShowDonateDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full" size="lg" disabled={isEnded}>
                        <Heart className="h-5 w-5 mr-2" />
                        {isEnded ? 'Campaign Ended' : 'Donate Now'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Make a Donation</DialogTitle>
                        <DialogDescription>
                          Support "{campaign.title}"
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6 py-4">
                        {/* Quick Amounts */}
                        <div>
                          <Label>Select Amount ({campaign.currency})</Label>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {DONATION_AMOUNTS.map(amount => (
                              <Button
                                key={amount}
                                variant={donationAmount === amount && !customAmount ? 'default' : 'outline'}
                                onClick={() => {
                                  setDonationAmount(amount);
                                  setCustomAmount('');
                                }}
                              >
                                {amount}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Custom Amount */}
                        <div>
                          <Label>Or enter custom amount</Label>
                          <div className="relative mt-2">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              {campaign.currency}
                            </span>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={customAmount}
                              onChange={(e) => setCustomAmount(e.target.value)}
                              className="pl-12"
                            />
                          </div>
                        </div>

                        {/* Message */}
                        <div>
                          <Label>Leave a message (optional)</Label>
                          <Textarea
                            placeholder="Write a message of support..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="mt-2"
                          />
                        </div>

                        {/* Anonymous */}
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Donate anonymously</Label>
                            <p className="text-sm text-muted-foreground">
                              Your name won't be shown publicly
                            </p>
                          </div>
                          <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                        </div>

                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={handleDonate}
                          disabled={createDonation.isPending}
                        >
                          <Wallet className="h-5 w-5 mr-2" />
                          {createDonation.isPending ? 'Processing...' : `Donate ${campaign.currency} ${customAmount || donationAmount}`}
                        </Button>

                        {!user && (
                          <p className="text-sm text-center text-muted-foreground">
                            <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to donate
                          </p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Share */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-center">Share this campaign</p>
                    <SocialShareButtons 
                      url={pageUrl}
                      title={campaign.title}
                      description={ogDescription}
                      className="justify-center"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CampaignDetail;
