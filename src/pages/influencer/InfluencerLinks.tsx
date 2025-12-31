import React, { useState } from 'react';
import InfluencerLayout from '@/components/layout/InfluencerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useInfluencerLinks, useClaimInfluencerCode } from '@/hooks/useInfluencerPortal';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Check, ExternalLink, Plus } from 'lucide-react';
import { formatCurrency } from '@/components/ui/currency-selector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const InfluencerLinks = () => {
  const { data: links, isLoading } = useInfluencerLinks();
  const claimCode = useClaimInfluencerCode();
  const [claimCodeInput, setClaimCodeInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClaimCode = async () => {
    if (!claimCodeInput.trim()) return;
    await claimCode.mutateAsync(claimCodeInput);
    setClaimCodeInput('');
    setDialogOpen(false);
  };

  const getShareLink = (link: any) => {
    const baseUrl = window.location.origin;
    if (link.event_id) {
      return `${baseUrl}/events/${link.event_id}?ref=${link.code}`;
    }
    if (link.contest_id) {
      return `${baseUrl}/contests/${link.contest_id}?ref=${link.code}`;
    }
    return `${baseUrl}?ref=${link.code}`;
  };

  return (
    <InfluencerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Links</h1>
            <p className="text-muted-foreground">Manage and track your referral links</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Claim Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Claim Influencer Code</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Enter the code provided by the organization</Label>
                  <Input
                    id="code"
                    placeholder="e.g., MICH2025"
                    value={claimCodeInput}
                    onChange={(e) => setClaimCodeInput(e.target.value.toUpperCase())}
                  />
                </div>
                <Button 
                  onClick={handleClaimCode} 
                  disabled={!claimCodeInput.trim() || claimCode.isPending}
                  className="w-full"
                >
                  {claimCode.isPending ? 'Claiming...' : 'Claim Code'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : links && links.length > 0 ? (
          <div className="grid gap-4">
            {links.map((link: any) => (
              <Card key={link.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{link.name}</CardTitle>
                      <CardDescription>
                        {link.contests?.title && `Contest: ${link.contests.title}`}
                        {link.events?.title && `Event: ${link.events.title}`}
                      </CardDescription>
                    </div>
                    <Badge variant={link.is_active ? 'default' : 'secondary'}>
                      {link.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Code and Link */}
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <code className="flex-1 text-sm font-mono truncate">{getShareLink(link)}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(getShareLink(link), link.id)}
                      >
                        {copiedId === link.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(getShareLink(link), '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-background border rounded-lg">
                        <p className="text-2xl font-bold">{link.total_clicks}</p>
                        <p className="text-xs text-muted-foreground">Clicks</p>
                      </div>
                      <div className="text-center p-3 bg-background border rounded-lg">
                        <p className="text-2xl font-bold">{link.total_conversions}</p>
                        <p className="text-xs text-muted-foreground">Conversions</p>
                      </div>
                      <div className="text-center p-3 bg-background border rounded-lg">
                        <p className="text-2xl font-bold">{formatCurrency(link.total_revenue || 0, 'USD')}</p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                      <div className="text-center p-3 bg-background border rounded-lg">
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(link.total_commission || 0, 'USD')}
                        </p>
                        <p className="text-xs text-muted-foreground">Earned</p>
                      </div>
                    </div>

                    {/* Commission Info */}
                    <p className="text-sm text-muted-foreground">
                      Commission: {link.commission_value}
                      {link.commission_type === 'percentage' ? '%' : ' (fixed)'} per conversion
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                You don't have any influencer links yet.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Contact an organization to get an influencer code, then claim it here.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Claim Your First Code
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </InfluencerLayout>
  );
};

export default InfluencerLinks;
