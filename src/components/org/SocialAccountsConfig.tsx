import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Link, Unlink, Trash2, ExternalLink, CheckCircle2, Send, Loader2, Shield, Zap, Globe } from 'lucide-react';
import { useOrganizationSocialAccounts, useConnectSocialAccount, useDisconnectSocialAccount, useDeleteSocialAccount } from '@/hooks/useOrganizationSocialAccounts';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Platform icons with brand colors
const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const platforms = [
  { 
    id: 'twitter', 
    name: 'X (Twitter)', 
    icon: TwitterIcon,
    bgClass: 'bg-foreground',
    description: 'Share updates & engage followers',
    apiLink: 'https://developer.twitter.com',
    apiLinkText: 'Get API access',
    features: ['Auto-post leaderboards', 'Voting reminders', 'Real-time updates']
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    icon: FacebookIcon,
    bgClass: 'bg-[#1877F2]',
    description: 'Reach your Facebook audience',
    apiLink: 'https://developers.facebook.com',
    apiLinkText: 'Get API access',
    features: ['Page posts', 'Event promotion', 'Community engagement']
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    icon: InstagramIcon,
    bgClass: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]',
    description: 'Visual content & stories',
    apiLink: 'https://developers.facebook.com/docs/instagram-api',
    apiLinkText: 'Get API access',
    features: ['Image posts', 'Story sharing', 'Visual branding']
  },
  { 
    id: 'tiktok', 
    name: 'TikTok', 
    icon: TikTokIcon,
    bgClass: 'bg-foreground',
    description: 'Short-form video content',
    apiLink: 'https://developers.tiktok.com',
    apiLinkText: 'Get API access',
    features: ['Video uploads', 'Trending content', 'Gen-Z reach']
  },
];

interface ConnectDialogProps {
  platform: typeof platforms[0];
  onConnect: (data: { platform: string; account_name: string; access_token?: string }) => void;
  isLoading: boolean;
}

const ConnectDialog = ({ platform, onConnect, isLoading }: ConnectDialogProps) => {
  const [accountName, setAccountName] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [open, setOpen] = useState(false);
  const Icon = platform.icon;

  const handleSubmit = () => {
    if (!accountName.trim()) return;
    onConnect({
      platform: platform.id,
      account_name: accountName.trim(),
      access_token: accessToken.trim() || undefined,
    });
    setOpen(false);
    setAccountName('');
    setAccessToken('');
  };

  const getPlaceholder = () => {
    switch (platform.id) {
      case 'twitter': return '@yourusername';
      case 'facebook': return 'Your Page name';
      case 'instagram': return '@yourusername';
      case 'tiktok': return '@yourusername';
      default: return 'Your account name';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-sm">
          <Link className="h-4 w-4" />
          Connect
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2.5 rounded-xl text-primary-foreground ${platform.bgClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Connect {platform.name}</DialogTitle>
              <DialogDescription className="text-xs">
                Link your account to enable auto-posting
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="account-name" className="text-sm font-medium">Account Handle</Label>
            <Input
              id="account-name"
              placeholder={getPlaceholder()}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="access-token" className="text-sm font-medium">API Access Token</Label>
              <Badge variant="secondary" className="text-[10px] font-normal">Optional</Badge>
            </div>
            <Input
              id="access-token"
              type="password"
              placeholder="Enter your API access token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="h-11 font-mono text-sm"
            />
          </div>
          
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
            <Shield className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p>Your credentials are encrypted and stored securely.</p>
              <a 
                href={platform.apiLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline inline-flex items-center gap-1 mt-1 font-medium"
              >
                {platform.apiLinkText}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!accountName.trim() || isLoading} className="gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Connect Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface TestPostDialogProps {
  platform: typeof platforms[0];
  accountName: string;
}

const TestPostDialog = ({ platform, accountName }: TestPostDialogProps) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(`🎉 Test post from our contest platform! Verifying ${platform.name} integration.`);
  const [isSending, setIsSending] = useState(false);
  const Icon = platform.icon;

  const handleTestPost = async () => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('social-post', {
        body: {
          platform: platform.id,
          message,
          isTest: true
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Test post sent!`, {
          description: `Successfully posted to ${accountName}`
        });
        setOpen(false);
      } else {
        throw new Error(data?.error || 'Failed to send test post');
      }
    } catch (error: any) {
      console.error('Test post error:', error);
      toast.error(`Failed to send test post`, {
        description: error.message || 'Check your API credentials'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
          <Send className="h-3.5 w-3.5" />
          Test
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2.5 rounded-xl text-primary-foreground ${platform.bgClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Send Test Post</DialogTitle>
              <DialogDescription className="text-xs">
                Verify your connection to {accountName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="test-message" className="text-sm font-medium">Test Message</Label>
            <Textarea
              id="test-message"
              placeholder="Enter your test message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" />
              This will post publicly to your {platform.name} account
            </p>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleTestPost} disabled={!message.trim() || isSending} className="gap-2">
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Test Post
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const SocialAccountsConfig = () => {
  const { data: accounts, isLoading } = useOrganizationSocialAccounts();
  const connectMutation = useConnectSocialAccount();
  const disconnectMutation = useDisconnectSocialAccount();
  const deleteMutation = useDeleteSocialAccount();

  const getAccountForPlatform = (platformId: string) => {
    return accounts?.find(a => a.platform === platformId);
  };

  const connectedCount = accounts?.filter(a => a.is_connected).length || 0;

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
              <Settings className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">Connected Accounts</CardTitle>
              <CardDescription className="mt-1">
                Link your social platforms to enable auto-posting
              </CardDescription>
            </div>
          </div>
          {connectedCount > 0 && (
            <Badge className="bg-primary/10 text-primary border-0 px-3 py-1">
              {connectedCount} Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {platforms.map((platform) => {
          const account = getAccountForPlatform(platform.id);
          const isConnected = account?.is_connected;
          const Icon = platform.icon;

          return (
            <div
              key={platform.id}
              className={`group relative rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                isConnected 
                  ? 'border-primary/20 bg-gradient-to-r from-primary/5 to-transparent' 
                  : 'border-border hover:border-muted-foreground/30 bg-card'
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl text-primary-foreground ${platform.bgClass} shadow-lg`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{platform.name}</h3>
                        {isConnected && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[10px] px-2 py-0.5 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </Badge>
                        )}
                      </div>
                      {isConnected ? (
                        <p className="text-sm text-muted-foreground font-medium">{account.account_name}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">{platform.description}</p>
                      )}
                      {!isConnected && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {platform.features.map((feature, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isConnected ? (
                      <>
                        <TestPostDialog platform={platform} accountName={account.account_name || ''} />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => disconnectMutation.mutate(account.id)}
                          disabled={disconnectMutation.isPending}
                          className="gap-1.5 h-8 text-xs"
                        >
                          <Unlink className="h-3.5 w-3.5" />
                          Disconnect
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove {platform.name} Account?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove this account and all associated settings. Any scheduled posts will stop working.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(account.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove Account
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    ) : (
                      <ConnectDialog
                        platform={platform}
                        onConnect={connectMutation.mutate}
                        isLoading={connectMutation.isPending}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};