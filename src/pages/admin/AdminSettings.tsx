import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePlatformSettings, useUpdatePlatformSetting } from '@/hooks/useAdminData';
import { Settings, CreditCard, Percent, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const AdminSettings: React.FC = () => {
  const { data: settings, isLoading } = usePlatformSettings();
  const updateSetting = useUpdatePlatformSetting();

  const getSetting = (key: string) => settings?.find(s => s.setting_key === key)?.setting_value || '';

  const handleUpdate = async (key: string, value: string) => {
    await updateSetting.mutateAsync({ key, value });
  };

  if (isLoading) {
    return <AdminLayout><div className="space-y-6"><Skeleton className="h-64 w-full" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground">Configure platform-wide settings</p>
        </div>

        <div className="grid gap-6">
          {/* Commission Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Percent className="h-5 w-5" /> Commission Settings</CardTitle>
              <CardDescription>Configure platform commission rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Platform Commission (%)</Label>
                  <Input type="number" defaultValue={getSetting('platform_commission_percentage')} onBlur={(e) => handleUpdate('platform_commission_percentage', e.target.value)} className="mt-2" />
                </div>
                <div>
                  <Label>Vote Commission (%)</Label>
                  <Input type="number" defaultValue={getSetting('vote_commission_percentage')} onBlur={(e) => handleUpdate('vote_commission_percentage', e.target.value)} className="mt-2" />
                </div>
                <div>
                  <Label>Ticket Commission (%)</Label>
                  <Input type="number" defaultValue={getSetting('ticket_commission_percentage')} onBlur={(e) => handleUpdate('ticket_commission_percentage', e.target.value)} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payment Settings</CardTitle>
              <CardDescription>Configure payment integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Flutterwave</p>
                  <p className="text-sm text-muted-foreground">Enable Flutterwave payment gateway</p>
                </div>
                <Switch checked={getSetting('flutterwave_enabled') === 'true'} onCheckedChange={(checked) => handleUpdate('flutterwave_enabled', String(checked))} />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Cryptocurrency Payments</p>
                  <p className="text-sm text-muted-foreground">Enable crypto payments (BTC, ETH, USDT, USDC)</p>
                </div>
                <Switch checked={getSetting('crypto_payment_enabled') === 'true'} onCheckedChange={(checked) => handleUpdate('crypto_payment_enabled', String(checked))} />
              </div>
              <div>
                <Label>Minimum Payout Amount (NGN)</Label>
                <Input type="number" defaultValue={getSetting('minimum_payout_amount')} onBlur={(e) => handleUpdate('minimum_payout_amount', e.target.value)} className="mt-2" />
              </div>
            </CardContent>
          </Card>

          {/* Flutterwave API Keys Notice */}
          <Card>
            <CardHeader>
              <CardTitle>Flutterwave Integration</CardTitle>
              <CardDescription>API keys for Flutterwave payment processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">Flutterwave API keys should be configured as environment secrets for security. Contact the development team to update payment credentials.</p>
                <p className="text-xs text-muted-foreground mt-2">Required secrets: FLUTTERWAVE_PUBLIC_KEY, FLUTTERWAVE_SECRET_KEY</p>
              </div>
            </CardContent>
          </Card>

          {/* Crypto Payment Notice */}
          <Card>
            <CardHeader>
              <CardTitle>Cryptocurrency Integration</CardTitle>
              <CardDescription>Setup for crypto payment processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">Cryptocurrency payments can be enabled through various providers. Supported currencies: BTC, ETH, USDT, USDC.</p>
                <p className="text-xs text-muted-foreground mt-2">Integration with providers like Coinbase Commerce, BitPay, or direct wallet addresses can be configured.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;