import React, { useState, useEffect } from 'react';
import InfluencerLayout from '@/components/layout/InfluencerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInfluencerProfile, useUpdateInfluencerProfile } from '@/hooks/useInfluencerPortal';
import { Skeleton } from '@/components/ui/skeleton';
import { Save } from 'lucide-react';

const InfluencerSettings = () => {
  const { data: profile, isLoading } = useInfluencerProfile();
  const updateProfile = useUpdateInfluencerProfile();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [usdtAddress, setUsdtAddress] = useState('');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setPaymentMethod(profile.payment_method || 'bank_transfer');
      setBankName(profile.bank_name || '');
      setAccountNumber(profile.account_number || '');
      setAccountName(profile.account_name || '');
      setUsdtAddress(profile.usdt_address || '');
    }
  }, [profile]);

  const handleSave = async () => {
    await updateProfile.mutateAsync({
      display_name: displayName,
      bio,
      payment_method: paymentMethod,
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
      usdt_address: usdtAddress,
    });
  };

  if (isLoading) {
    return (
      <InfluencerLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </InfluencerLayout>
    );
  }

  return (
    <InfluencerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your profile and payment preferences</p>
        </div>

        <div className="grid gap-6 max-w-2xl">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your display name and bio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Your name or brand"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell organizations about yourself"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Preferences</CardTitle>
              <CardDescription>Configure how you want to receive payouts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Preferred Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="crypto">Crypto (USDT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === 'bank_transfer' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      placeholder="Enter bank name"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      placeholder="Enter account number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      placeholder="Enter account name"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                    />
                  </div>
                </>
              )}

              {paymentMethod === 'crypto' && (
                <div className="space-y-2">
                  <Label htmlFor="usdtAddress">USDT Wallet Address</Label>
                  <Input
                    id="usdtAddress"
                    placeholder="TRC20 or ERC20 address"
                    value={usdtAddress}
                    onChange={(e) => setUsdtAddress(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    We support USDT on TRC20 (Tron) and ERC20 (Ethereum) networks
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={updateProfile.isPending} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </InfluencerLayout>
  );
};

export default InfluencerSettings;
