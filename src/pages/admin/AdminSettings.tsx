import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlatformSettings, useUpdatePlatformSetting } from '@/hooks/useAdminData';
import { Settings, CreditCard, Percent, Wallet, Bitcoin, Mail } from 'lucide-react';
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

        <Tabs defaultValue="commission">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="commission">Commission</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="crypto">Crypto</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="commission" className="space-y-6 mt-6">
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
          </TabsContent>

          <TabsContent value="payments" className="space-y-6 mt-6">
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
                    <p className="text-sm text-muted-foreground">Enable crypto payments (USDT, USDC)</p>
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
                  <p className="text-sm">Flutterwave API keys are configured as environment secrets for security.</p>
                  <p className="text-xs text-muted-foreground mt-2">Configured secrets: FLUTTERWAVE_PUBLIC_KEY, FLUTTERWAVE_SECRET_KEY</p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-green-600">Connected</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="crypto" className="space-y-6 mt-6">
            {/* Crypto Payment Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bitcoin className="h-5 w-5" /> Cryptocurrency Wallet Addresses</CardTitle>
                <CardDescription>Configure wallet addresses to receive crypto payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">BNB Smart Chain (BSC)</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>USDT Wallet (BEP20)</Label>
                      <Input 
                        placeholder="0x..." 
                        defaultValue={getSetting('crypto_wallet_bsc_usdt')} 
                        onBlur={(e) => handleUpdate('crypto_wallet_bsc_usdt', e.target.value)} 
                        className="mt-2 font-mono text-sm" 
                      />
                    </div>
                    <div>
                      <Label>USDC Wallet (BEP20)</Label>
                      <Input 
                        placeholder="0x..." 
                        defaultValue={getSetting('crypto_wallet_bsc_usdc')} 
                        onBlur={(e) => handleUpdate('crypto_wallet_bsc_usdc', e.target.value)} 
                        className="mt-2 font-mono text-sm" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Ethereum</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>USDT Wallet (ERC20)</Label>
                      <Input 
                        placeholder="0x..." 
                        defaultValue={getSetting('crypto_wallet_ethereum_usdt')} 
                        onBlur={(e) => handleUpdate('crypto_wallet_ethereum_usdt', e.target.value)} 
                        className="mt-2 font-mono text-sm" 
                      />
                    </div>
                    <div>
                      <Label>USDC Wallet (ERC20)</Label>
                      <Input 
                        placeholder="0x..." 
                        defaultValue={getSetting('crypto_wallet_ethereum_usdc')} 
                        onBlur={(e) => handleUpdate('crypto_wallet_ethereum_usdc', e.target.value)} 
                        className="mt-2 font-mono text-sm" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Polygon</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>USDT Wallet</Label>
                      <Input 
                        placeholder="0x..." 
                        defaultValue={getSetting('crypto_wallet_polygon_usdt')} 
                        onBlur={(e) => handleUpdate('crypto_wallet_polygon_usdt', e.target.value)} 
                        className="mt-2 font-mono text-sm" 
                      />
                    </div>
                    <div>
                      <Label>USDC Wallet</Label>
                      <Input 
                        placeholder="0x..." 
                        defaultValue={getSetting('crypto_wallet_polygon_usdc')} 
                        onBlur={(e) => handleUpdate('crypto_wallet_polygon_usdc', e.target.value)} 
                        className="mt-2 font-mono text-sm" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Tron (TRC20)</h4>
                  <div>
                    <Label>USDT Wallet (TRC20)</Label>
                    <Input 
                      placeholder="T..." 
                      defaultValue={getSetting('crypto_wallet_tron_usdt')} 
                      onBlur={(e) => handleUpdate('crypto_wallet_tron_usdt', e.target.value)} 
                      className="mt-2 font-mono text-sm" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Crypto Payment Verification</CardTitle>
                <CardDescription>Settings for manual payment verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">Crypto payments require manual verification by admins. When a user submits a transaction hash, it will appear in the Fraud Alerts section for review.</p>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Auto-notify on pending verification</p>
                    <p className="text-sm text-muted-foreground">Send email to admins when crypto payment needs verification</p>
                  </div>
                  <Switch checked={getSetting('crypto_notify_admins') === 'true'} onCheckedChange={(checked) => handleUpdate('crypto_notify_admins', String(checked))} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 mt-6">
            {/* Email Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Email Notifications</CardTitle>
                <CardDescription>Configure admin email notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Fraud Alerts</p>
                    <p className="text-sm text-muted-foreground">Notify admins when fraud is detected</p>
                  </div>
                  <Switch checked={getSetting('notify_fraud_alerts') === 'true'} onCheckedChange={(checked) => handleUpdate('notify_fraud_alerts', String(checked))} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Payout Requests</p>
                    <p className="text-sm text-muted-foreground">Notify when organizations request payouts</p>
                  </div>
                  <Switch checked={getSetting('notify_payout_requests') === 'true'} onCheckedChange={(checked) => handleUpdate('notify_payout_requests', String(checked))} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">New Organizations</p>
                    <p className="text-sm text-muted-foreground">Notify when new organizations register</p>
                  </div>
                  <Switch checked={getSetting('notify_new_organizations') === 'true'} onCheckedChange={(checked) => handleUpdate('notify_new_organizations', String(checked))} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Content Moderation</p>
                    <p className="text-sm text-muted-foreground">Notify when content needs review</p>
                  </div>
                  <Switch checked={getSetting('notify_content_moderation') === 'true'} onCheckedChange={(checked) => handleUpdate('notify_content_moderation', String(checked))} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Integration</CardTitle>
                <CardDescription>Email service configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">Email notifications are sent via Resend.</p>
                  <p className="text-xs text-muted-foreground mt-2">Configured secret: RESEND_API_KEY</p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-green-600">Connected</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;