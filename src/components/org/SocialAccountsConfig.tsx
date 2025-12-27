import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Link, Unlink, Trash2, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import { useOrganizationSocialAccounts, useConnectSocialAccount, useDisconnectSocialAccount, useDeleteSocialAccount } from '@/hooks/useOrganizationSocialAccounts';

// Platform icons
const TwitterIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const TikTokIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const platforms = [
  { 
    id: 'twitter', 
    name: 'Twitter / X', 
    icon: TwitterIcon,
    color: 'bg-black',
    description: 'Post updates and leaderboards to Twitter',
    available: true
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    icon: FacebookIcon,
    color: 'bg-blue-600',
    description: 'Share to your Facebook page',
    available: false
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    icon: InstagramIcon,
    color: 'bg-gradient-to-br from-purple-600 to-pink-500',
    description: 'Post to Instagram (via Meta Business)',
    available: false
  },
  { 
    id: 'tiktok', 
    name: 'TikTok', 
    icon: TikTokIcon,
    color: 'bg-black',
    description: 'Share videos to TikTok',
    available: false
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Link className="h-4 w-4" />
          Connect
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <platform.icon />
            Connect {platform.name}
          </DialogTitle>
          <DialogDescription>
            Enter your {platform.name} account details to enable auto-posting.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="account-name">Account Name / Handle</Label>
            <Input
              id="account-name"
              placeholder={platform.id === 'twitter' ? '@yourusername' : 'Your account name'}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </div>
          {platform.id === 'twitter' && (
            <div className="space-y-2">
              <Label htmlFor="access-token">API Access Token (Optional)</Label>
              <Input
                id="access-token"
                type="password"
                placeholder="Your API access token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                For full automation, you'll need Twitter API credentials. 
                <a href="https://developer.twitter.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                  Get API access <ExternalLink className="h-3 w-3 inline" />
                </a>
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!accountName.trim() || isLoading}>
            {isLoading ? 'Connecting...' : 'Connect Account'}
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Social Media Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Social Media Accounts
        </CardTitle>
        <CardDescription>
          Connect your social media accounts to enable auto-posting for your contests and events.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {platforms.map((platform) => {
          const account = getAccountForPlatform(platform.id);
          const isConnected = account?.is_connected;

          return (
            <div
              key={platform.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-lg text-white ${platform.color}`}>
                  <platform.icon />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{platform.name}</span>
                    {!platform.available && (
                      <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                    )}
                    {isConnected && (
                      <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isConnected ? account.account_name : platform.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {platform.available ? (
                  isConnected ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => disconnectMutation.mutate(account.id)}
                        disabled={disconnectMutation.isPending}
                      >
                        <Unlink className="h-4 w-4 mr-1" />
                        Disconnect
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove this {platform.name} account? This will delete all associated settings.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(account.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
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
                  )
                ) : (
                  <Button size="sm" variant="outline" disabled>
                    <XCircle className="h-4 w-4 mr-1" />
                    Not Available
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
