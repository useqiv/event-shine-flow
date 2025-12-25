import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlatformSettings, useUpdatePlatformSetting } from '@/hooks/useAdminData';
import { Settings, CreditCard, Percent, Wallet, Bitcoin, Mail, Loader2, CheckCircle, XCircle, RefreshCw, Receipt, Download, CalendarIcon, TrendingUp, DollarSign, ShoppingCart, Ticket, ArrowUpDown, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { exportToCsv, formatDateForExport, formatCurrencyForExport } from '@/lib/exportCsv';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const AdminSettings: React.FC = () => {
  const { data: settings, isLoading } = usePlatformSettings();
  const updateSetting = useUpdatePlatformSetting();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message: string;
    balance?: { currency: string; available_balance: number };
    test_mode?: boolean;
  } | null>(null);

  // Flutterwave form state
  const [flutterwaveForm, setFlutterwaveForm] = useState({
    public_key: '',
    secret_key: '',
    encryption_key: '',
    webhook_secret: '',
    currencies: '',
    default_currency: '',
  });
  const [flutterwaveFormDirty, setFlutterwaveFormDirty] = useState(false);
  const [isSavingFlutterwave, setIsSavingFlutterwave] = useState(false);
  const [flutterwaveErrors, setFlutterwaveErrors] = useState<Record<string, string>>({});

  // Initialize Flutterwave form when settings load
  React.useEffect(() => {
    if (settings) {
      setFlutterwaveForm({
        public_key: settings.find(s => s.setting_key === 'flutterwave_public_key')?.setting_value || '',
        secret_key: settings.find(s => s.setting_key === 'flutterwave_secret_key')?.setting_value || '',
        encryption_key: settings.find(s => s.setting_key === 'flutterwave_encryption_key')?.setting_value || '',
        webhook_secret: settings.find(s => s.setting_key === 'flutterwave_webhook_secret')?.setting_value || '',
        currencies: settings.find(s => s.setting_key === 'flutterwave_currencies')?.setting_value || 'NGN, USD',
        default_currency: settings.find(s => s.setting_key === 'flutterwave_default_currency')?.setting_value || 'NGN',
      });
      setFlutterwaveFormDirty(false);
    }
  }, [settings]);

  // Validate Flutterwave API keys
  const validateFlutterwaveKeys = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Public key validation - should start with FLWPUBK or FLWPUBK_TEST
    if (flutterwaveForm.public_key && !/^FLWPUBK[_-]?[A-Za-z0-9]+$/i.test(flutterwaveForm.public_key)) {
      errors.public_key = 'Invalid format. Should start with FLWPUBK (e.g., FLWPUBK-xxxxxxxx-X)';
    }
    
    // Secret key validation - should start with FLWSECK or FLWSECK_TEST
    if (flutterwaveForm.secret_key && !/^FLWSECK[_-]?[A-Za-z0-9]+$/i.test(flutterwaveForm.secret_key)) {
      errors.secret_key = 'Invalid format. Should start with FLWSECK (e.g., FLWSECK-xxxxxxxx-X)';
    }
    
    setFlutterwaveErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFlutterwaveFormChange = (field: string, value: string) => {
    setFlutterwaveForm(prev => ({ ...prev, [field]: value }));
    setFlutterwaveFormDirty(true);
    // Clear error for this field when user types
    if (flutterwaveErrors[field]) {
      setFlutterwaveErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const saveFlutterwaveSettings = async () => {
    if (!validateFlutterwaveKeys()) {
      toast.error('Please fix the validation errors before saving');
      return;
    }

    setIsSavingFlutterwave(true);
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: 'flutterwave_public_key', value: flutterwaveForm.public_key }),
        updateSetting.mutateAsync({ key: 'flutterwave_secret_key', value: flutterwaveForm.secret_key }),
        updateSetting.mutateAsync({ key: 'flutterwave_encryption_key', value: flutterwaveForm.encryption_key }),
        updateSetting.mutateAsync({ key: 'flutterwave_webhook_secret', value: flutterwaveForm.webhook_secret }),
        updateSetting.mutateAsync({ key: 'flutterwave_currencies', value: flutterwaveForm.currencies }),
        updateSetting.mutateAsync({ key: 'flutterwave_default_currency', value: flutterwaveForm.default_currency }),
      ]);
      toast.success('Flutterwave settings saved successfully');
      setFlutterwaveFormDirty(false);
    } catch (error) {
      toast.error('Failed to save Flutterwave settings');
    } finally {
      setIsSavingFlutterwave(false);
    }
  };

  // Commission form state
  const [commissionForm, setCommissionForm] = useState({
    platform_commission_percentage: '',
    vote_commission_percentage: '',
    ticket_commission_percentage: '',
  });
  const [commissionFormDirty, setCommissionFormDirty] = useState(false);
  const [isSavingCommission, setIsSavingCommission] = useState(false);

  // Initialize Commission form when settings load
  useEffect(() => {
    if (settings) {
      setCommissionForm({
        platform_commission_percentage: settings.find(s => s.setting_key === 'platform_commission_percentage')?.setting_value || '',
        vote_commission_percentage: settings.find(s => s.setting_key === 'vote_commission_percentage')?.setting_value || '',
        ticket_commission_percentage: settings.find(s => s.setting_key === 'ticket_commission_percentage')?.setting_value || '',
      });
      setCommissionFormDirty(false);
    }
  }, [settings]);

  const handleCommissionFormChange = (field: string, value: string) => {
    setCommissionForm(prev => ({ ...prev, [field]: value }));
    setCommissionFormDirty(true);
  };

  const saveCommissionSettings = async () => {
    setIsSavingCommission(true);
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: 'platform_commission_percentage', value: commissionForm.platform_commission_percentage }),
        updateSetting.mutateAsync({ key: 'vote_commission_percentage', value: commissionForm.vote_commission_percentage }),
        updateSetting.mutateAsync({ key: 'ticket_commission_percentage', value: commissionForm.ticket_commission_percentage }),
      ]);
      toast.success('Commission settings saved successfully');
      setCommissionFormDirty(false);
    } catch (error) {
      toast.error('Failed to save commission settings');
    } finally {
      setIsSavingCommission(false);
    }
  };

  // Crypto form state
  const [cryptoForm, setCryptoForm] = useState({
    crypto_wallet_bsc_usdt: '',
    crypto_wallet_bsc_usdc: '',
    crypto_wallet_ethereum_usdt: '',
    crypto_wallet_ethereum_usdc: '',
    crypto_wallet_polygon_usdt: '',
    crypto_wallet_polygon_usdc: '',
    crypto_wallet_tron_usdt: '',
  });
  const [cryptoFormDirty, setCryptoFormDirty] = useState(false);
  const [isSavingCrypto, setIsSavingCrypto] = useState(false);
  const [cryptoErrors, setCryptoErrors] = useState<Record<string, string>>({});

  // Initialize Crypto form when settings load
  useEffect(() => {
    if (settings) {
      setCryptoForm({
        crypto_wallet_bsc_usdt: settings.find(s => s.setting_key === 'crypto_wallet_bsc_usdt')?.setting_value || '',
        crypto_wallet_bsc_usdc: settings.find(s => s.setting_key === 'crypto_wallet_bsc_usdc')?.setting_value || '',
        crypto_wallet_ethereum_usdt: settings.find(s => s.setting_key === 'crypto_wallet_ethereum_usdt')?.setting_value || '',
        crypto_wallet_ethereum_usdc: settings.find(s => s.setting_key === 'crypto_wallet_ethereum_usdc')?.setting_value || '',
        crypto_wallet_polygon_usdt: settings.find(s => s.setting_key === 'crypto_wallet_polygon_usdt')?.setting_value || '',
        crypto_wallet_polygon_usdc: settings.find(s => s.setting_key === 'crypto_wallet_polygon_usdc')?.setting_value || '',
        crypto_wallet_tron_usdt: settings.find(s => s.setting_key === 'crypto_wallet_tron_usdt')?.setting_value || '',
      });
      setCryptoFormDirty(false);
    }
  }, [settings]);

  const validateCryptoAddresses = (): boolean => {
    const errors: Record<string, string> = {};
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    const tronAddressRegex = /^T[a-zA-Z0-9]{33}$/;

    // Validate ETH-based addresses (BSC, Ethereum, Polygon)
    const ethFields = ['crypto_wallet_bsc_usdt', 'crypto_wallet_bsc_usdc', 'crypto_wallet_ethereum_usdt', 'crypto_wallet_ethereum_usdc', 'crypto_wallet_polygon_usdt', 'crypto_wallet_polygon_usdc'];
    ethFields.forEach(field => {
      const value = cryptoForm[field as keyof typeof cryptoForm];
      if (value && !ethAddressRegex.test(value)) {
        errors[field] = 'Invalid address format. Should start with 0x followed by 40 hex characters';
      }
    });

    // Validate Tron address
    if (cryptoForm.crypto_wallet_tron_usdt && !tronAddressRegex.test(cryptoForm.crypto_wallet_tron_usdt)) {
      errors.crypto_wallet_tron_usdt = 'Invalid Tron address format. Should start with T followed by 33 characters';
    }

    setCryptoErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCryptoFormChange = (field: string, value: string) => {
    setCryptoForm(prev => ({ ...prev, [field]: value }));
    setCryptoFormDirty(true);
    if (cryptoErrors[field]) {
      setCryptoErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const saveCryptoSettings = async () => {
    if (!validateCryptoAddresses()) {
      toast.error('Please fix the validation errors before saving');
      return;
    }

    setIsSavingCrypto(true);
    try {
      await Promise.all(
        Object.entries(cryptoForm).map(([key, value]) =>
          updateSetting.mutateAsync({ key, value })
        )
      );
      toast.success('Crypto wallet settings saved successfully');
      setCryptoFormDirty(false);
    } catch (error) {
      toast.error('Failed to save crypto settings');
    } finally {
      setIsSavingCrypto(false);
    }
  };

  // Track if any form has unsaved changes
  const hasUnsavedChanges = flutterwaveFormDirty || commissionFormDirty || cryptoFormDirty;

  // Tab navigation with unsaved changes warning
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState('commission');

  const handleTabChange = (newTab: string) => {
    if (hasUnsavedChanges) {
      setPendingTab(newTab);
      setShowUnsavedDialog(true);
    } else {
      setCurrentTab(newTab);
    }
  };

  const confirmTabChange = () => {
    if (pendingTab) {
      setCurrentTab(pendingTab);
      // Reset all dirty states
      setFlutterwaveFormDirty(false);
      setCommissionFormDirty(false);
      setCryptoFormDirty(false);
    }
    setShowUnsavedDialog(false);
    setPendingTab(null);
  };

  // Date range state for transaction filter
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Transaction type filter
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('all');

  const getSetting = (key: string) => settings?.find(s => s.setting_key === key)?.setting_value || '';

  const handleUpdate = async (key: string, value: string) => {
    await updateSetting.mutateAsync({ key, value });
  };

  // Fetch transactions with date and type filter
  const { data: recentTransactions, isLoading: loadingTransactions, refetch: refetchTransactions } = useQuery({
    queryKey: ['admin-recent-transactions', dateRange.from, dateRange.to, transactionTypeFilter],
    queryFn: async () => {
      const types = transactionTypeFilter === 'all' 
        ? ['vote_purchase', 'ticket_purchase', 'deposit', 'refund']
        : [transactionTypeFilter];

      let query = supabase
        .from('wallet_transactions')
        .select('*, wallets(user_id, profiles:user_id(full_name, email))')
        .in('type', types)
        .order('created_at', { ascending: false });

      if (dateRange.from) {
        query = query.gte('created_at', startOfDay(dateRange.from).toISOString());
      }
      if (dateRange.to) {
        query = query.lte('created_at', endOfDay(dateRange.to).toISOString());
      }

      const { data, error } = await query.limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate transaction statistics
  const transactionStats = React.useMemo(() => {
    if (!recentTransactions || recentTransactions.length === 0) {
      return {
        totalAmount: 0,
        averageAmount: 0,
        count: 0,
        byType: {} as Record<string, { count: number; amount: number }>,
      };
    }

    const byType: Record<string, { count: number; amount: number }> = {};
    let totalAmount = 0;

    recentTransactions.forEach((tx: any) => {
      const amount = Number(tx.amount) || 0;
      totalAmount += amount;
      
      if (!byType[tx.type]) {
        byType[tx.type] = { count: 0, amount: 0 };
      }
      byType[tx.type].count++;
      byType[tx.type].amount += amount;
    });

    return {
      totalAmount,
      averageAmount: totalAmount / recentTransactions.length,
      count: recentTransactions.length,
      byType,
    };
  }, [recentTransactions]);

  const testFlutterwaveConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('test-flutterwave-connection');
      
      if (error) throw error;
      
      setConnectionStatus(data);
      
      if (data.connected) {
        toast.success('Flutterwave connection successful!');
      } else {
        toast.error(data.message || 'Connection failed');
      }
    } catch (err: any) {
      setConnectionStatus({ connected: false, message: err.message });
      toast.error('Failed to test connection');
    } finally {
      setIsTestingConnection(false);
    }
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

        {/* Unsaved Changes Dialog */}
        <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Unsaved Changes
              </AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes in the current tab. If you leave now, your changes will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingTab(null)}>Stay & Edit</AlertDialogCancel>
              <AlertDialogAction onClick={confirmTabChange} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Discard Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="commission">
              Commission
              {commissionFormDirty && <span className="ml-1.5 h-2 w-2 rounded-full bg-amber-500" />}
            </TabsTrigger>
            <TabsTrigger value="payments">
              Payments
              {flutterwaveFormDirty && <span className="ml-1.5 h-2 w-2 rounded-full bg-amber-500" />}
            </TabsTrigger>
            <TabsTrigger value="crypto">
              Crypto
              {cryptoFormDirty && <span className="ml-1.5 h-2 w-2 rounded-full bg-amber-500" />}
            </TabsTrigger>
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
                    <Input 
                      type="number" 
                      value={commissionForm.platform_commission_percentage}
                      onChange={(e) => handleCommissionFormChange('platform_commission_percentage', e.target.value)}
                      className="mt-2" 
                    />
                  </div>
                  <div>
                    <Label>Vote Commission (%)</Label>
                    <Input 
                      type="number" 
                      value={commissionForm.vote_commission_percentage}
                      onChange={(e) => handleCommissionFormChange('vote_commission_percentage', e.target.value)}
                      className="mt-2" 
                    />
                  </div>
                  <div>
                    <Label>Ticket Commission (%)</Label>
                    <Input 
                      type="number" 
                      value={commissionForm.ticket_commission_percentage}
                      onChange={(e) => handleCommissionFormChange('ticket_commission_percentage', e.target.value)}
                      className="mt-2" 
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button 
                    onClick={saveCommissionSettings}
                    disabled={!commissionFormDirty || isSavingCommission}
                  >
                    {isSavingCommission ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      <><CheckCircle className="h-4 w-4 mr-2" /> Save Commission Settings</>
                    )}
                  </Button>
                  {commissionFormDirty && (
                    <span className="text-sm text-muted-foreground">You have unsaved changes</span>
                  )}
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

            {/* Flutterwave Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Flutterwave Configuration</CardTitle>
                <CardDescription>Configure Flutterwave payment gateway settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Test Mode</p>
                    <p className="text-sm text-muted-foreground">Use Flutterwave sandbox for testing</p>
                  </div>
                  <Switch 
                    checked={getSetting('flutterwave_test_mode') === 'true'} 
                    onCheckedChange={(checked) => handleUpdate('flutterwave_test_mode', String(checked))} 
                  />
                </div>

                <div className="grid gap-4">
                  <div>
                    <Label>Public Key</Label>
                    <Input 
                      type="password"
                      placeholder="FLWPUBK-xxxxxxxxxxxx-X" 
                      value={flutterwaveForm.public_key}
                      onChange={(e) => handleFlutterwaveFormChange('public_key', e.target.value)}
                      className={cn("mt-2 font-mono text-sm", flutterwaveErrors.public_key && "border-destructive")}
                    />
                    {flutterwaveErrors.public_key ? (
                      <p className="text-xs text-destructive mt-1">{flutterwaveErrors.public_key}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Your Flutterwave public key</p>
                    )}
                  </div>
                  <div>
                    <Label>Secret Key</Label>
                    <Input 
                      type="password"
                      placeholder="FLWSECK-xxxxxxxxxxxx-X" 
                      value={flutterwaveForm.secret_key}
                      onChange={(e) => handleFlutterwaveFormChange('secret_key', e.target.value)}
                      className={cn("mt-2 font-mono text-sm", flutterwaveErrors.secret_key && "border-destructive")}
                    />
                    {flutterwaveErrors.secret_key ? (
                      <p className="text-xs text-destructive mt-1">{flutterwaveErrors.secret_key}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Your Flutterwave secret key (keep this secure)</p>
                    )}
                  </div>
                  <div>
                    <Label>Encryption Key</Label>
                    <Input 
                      type="password"
                      placeholder="Your encryption key" 
                      value={flutterwaveForm.encryption_key}
                      onChange={(e) => handleFlutterwaveFormChange('encryption_key', e.target.value)}
                      className="mt-2 font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Used for encrypting payment data</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Webhook URL</Label>
                    <Input 
                      readOnly
                      value={`https://tirqmqzgksclsjxfiham.supabase.co/functions/v1/flutterwave-webhook`}
                      className="mt-2 font-mono text-sm bg-muted cursor-pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://tirqmqzgksclsjxfiham.supabase.co/functions/v1/flutterwave-webhook`);
                        toast.success('Webhook URL copied to clipboard');
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Add this URL in your Flutterwave dashboard</p>
                  </div>
                  <div>
                    <Label>Webhook Secret Hash</Label>
                    <Input 
                      type="password"
                      placeholder="Your webhook secret hash" 
                      value={flutterwaveForm.webhook_secret}
                      onChange={(e) => handleFlutterwaveFormChange('webhook_secret', e.target.value)}
                      className="mt-2 font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">For verifying webhook authenticity</p>
                  </div>
                </div>

                <div>
                  <Label>Supported Currencies</Label>
                  <Input 
                    placeholder="NGN, USD, GHS, KES" 
                    value={flutterwaveForm.currencies}
                    onChange={(e) => handleFlutterwaveFormChange('currencies', e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Comma-separated list of accepted currencies</p>
                </div>

                <div>
                  <Label>Default Currency</Label>
                  <Input 
                    placeholder="NGN" 
                    value={flutterwaveForm.default_currency}
                    onChange={(e) => handleFlutterwaveFormChange('default_currency', e.target.value)}
                    className="mt-2"
                  />
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-3 pt-2">
                  <Button 
                    onClick={saveFlutterwaveSettings}
                    disabled={!flutterwaveFormDirty || isSavingFlutterwave}
                  >
                    {isSavingFlutterwave ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      <><CheckCircle className="h-4 w-4 mr-2" /> Save Configuration</>
                    )}
                  </Button>
                  {flutterwaveFormDirty && (
                    <span className="text-sm text-muted-foreground">You have unsaved changes</span>
                  )}
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Setup Instructions</p>
                  <ol className="text-xs text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                    <li>Log in to your Flutterwave dashboard</li>
                    <li>Go to Settings → API Keys to get your keys</li>
                    <li>Copy the Webhook URL above and add it in Settings → Webhooks</li>
                    <li>Set a secret hash for webhook verification</li>
                  </ol>
                </div>

                {/* Connection Status Indicator */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Connection Status</p>
                      <p className="text-sm text-muted-foreground">Test your Flutterwave API credentials</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={testFlutterwaveConnection}
                      disabled={isTestingConnection}
                    >
                      {isTestingConnection ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Testing...</>
                      ) : (
                        <><RefreshCw className="h-4 w-4 mr-2" /> Test Connection</>
                      )}
                    </Button>
                  </div>
                  
                  {connectionStatus && (
                    <div className={`p-3 rounded-lg flex items-start gap-3 ${
                      connectionStatus.connected ? 'bg-green-500/10 border border-green-500/20' : 'bg-destructive/10 border border-destructive/20'
                    }`}>
                      {connectionStatus.connected ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${connectionStatus.connected ? 'text-green-600' : 'text-destructive'}`}>
                          {connectionStatus.connected ? 'Connected Successfully' : 'Connection Failed'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{connectionStatus.message}</p>
                        {connectionStatus.connected && connectionStatus.balance && (
                          <div className="mt-2 p-2 bg-background rounded text-xs">
                            <p>Account Balance: <span className="font-mono font-medium">{connectionStatus.balance.currency} {connectionStatus.balance.available_balance?.toLocaleString()}</span></p>
                            {connectionStatus.test_mode && (
                              <Badge variant="secondary" className="mt-1">Test Mode</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Fees Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" /> Payment Fees & Surcharges</CardTitle>
                <CardDescription>Configure fees applied to different payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg space-y-4">
                    <h4 className="font-medium">Flutterwave Fees</h4>
                    <div>
                      <Label>Transaction Fee (%)</Label>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="1.4" 
                        defaultValue={getSetting('flutterwave_fee_percentage') || '0'} 
                        onBlur={(e) => handleUpdate('flutterwave_fee_percentage', e.target.value)} 
                        className="mt-2" 
                      />
                      <p className="text-xs text-muted-foreground mt-1">Percentage fee per transaction</p>
                    </div>
                    <div>
                      <Label>Fixed Fee (NGN)</Label>
                      <Input 
                        type="number" 
                        placeholder="100" 
                        defaultValue={getSetting('flutterwave_fee_fixed') || '0'} 
                        onBlur={(e) => handleUpdate('flutterwave_fee_fixed', e.target.value)} 
                        className="mt-2" 
                      />
                      <p className="text-xs text-muted-foreground mt-1">Fixed fee per transaction</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Pass Fee to Customer</p>
                        <p className="text-xs text-muted-foreground">Customer pays the transaction fee</p>
                      </div>
                      <Switch 
                        checked={getSetting('flutterwave_fee_pass_to_customer') === 'true'} 
                        onCheckedChange={(checked) => handleUpdate('flutterwave_fee_pass_to_customer', String(checked))} 
                      />
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg space-y-4">
                    <h4 className="font-medium">Crypto Fees</h4>
                    <div>
                      <Label>Transaction Fee (%)</Label>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="0.5" 
                        defaultValue={getSetting('crypto_fee_percentage') || '0'} 
                        onBlur={(e) => handleUpdate('crypto_fee_percentage', e.target.value)} 
                        className="mt-2" 
                      />
                      <p className="text-xs text-muted-foreground mt-1">Percentage fee per crypto transaction</p>
                    </div>
                    <div>
                      <Label>Network Fee Surcharge (USD)</Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="2.00" 
                        defaultValue={getSetting('crypto_network_surcharge') || '0'} 
                        onBlur={(e) => handleUpdate('crypto_network_surcharge', e.target.value)} 
                        className="mt-2" 
                      />
                      <p className="text-xs text-muted-foreground mt-1">Additional fee to cover network costs</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Pass Fee to Customer</p>
                        <p className="text-xs text-muted-foreground">Customer pays the transaction fee</p>
                      </div>
                      <Switch 
                        checked={getSetting('crypto_fee_pass_to_customer') === 'true'} 
                        onCheckedChange={(checked) => handleUpdate('crypto_fee_pass_to_customer', String(checked))} 
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg space-y-4">
                  <h4 className="font-medium">Convenience Fee</h4>
                  <p className="text-sm text-muted-foreground">Add an optional convenience fee to all transactions</p>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label>Fee Type</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                        defaultValue={getSetting('convenience_fee_type') || 'none'}
                        onChange={(e) => handleUpdate('convenience_fee_type', e.target.value)}
                      >
                        <option value="none">None</option>
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>
                    <div>
                      <Label>Fee Value</Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0" 
                        defaultValue={getSetting('convenience_fee_value') || '0'} 
                        onBlur={(e) => handleUpdate('convenience_fee_value', e.target.value)} 
                        className="mt-2" 
                      />
                    </div>
                    <div>
                      <Label>Fee Cap (Max Amount)</Label>
                      <Input 
                        type="number" 
                        placeholder="5000" 
                        defaultValue={getSetting('convenience_fee_cap') || ''} 
                        onBlur={(e) => handleUpdate('convenience_fee_cap', e.target.value)} 
                        className="mt-2" 
                      />
                      <p className="text-xs text-muted-foreground mt-1">Leave empty for no cap</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transaction Logs */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Transaction Logs</CardTitle>
                      <CardDescription>Payment transactions filtered by date range</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          if (!recentTransactions || recentTransactions.length === 0) {
                            toast.error('No transactions to export');
                            return;
                          }
                          const exportData = recentTransactions.map((tx: any) => ({
                            date: formatDateForExport(tx.created_at),
                            user_name: tx.wallets?.profiles?.full_name || 'Unknown',
                            user_email: tx.wallets?.profiles?.email || '',
                            type: tx.type.replace('_', ' '),
                            amount: formatCurrencyForExport(tx.amount),
                            status: tx.status,
                            reference: tx.reference_id || '',
                            description: tx.description || '',
                          }));
                          exportToCsv(exportData, `transactions-export-${format(new Date(), 'yyyy-MM-dd')}`, [
                            { key: 'date', label: 'Date' },
                            { key: 'user_name', label: 'User Name' },
                            { key: 'user_email', label: 'Email' },
                            { key: 'type', label: 'Type' },
                            { key: 'amount', label: 'Amount (NGN)' },
                            { key: 'status', label: 'Status' },
                            { key: 'reference', label: 'Reference' },
                            { key: 'description', label: 'Description' },
                          ]);
                          toast.success('Transactions exported to CSV');
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" /> Export CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => refetchTransactions()}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                      </Button>
                    </div>
                  </div>

                  {/* Filters Row */}
                  <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Filters:</span>
                    
                    {/* Type Filter */}
                    <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                      <SelectTrigger className="w-[160px] h-9">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="vote_purchase">Vote Purchases</SelectItem>
                        <SelectItem value="ticket_purchase">Ticket Purchases</SelectItem>
                        <SelectItem value="deposit">Deposits</SelectItem>
                        <SelectItem value="refund">Refunds</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Date Range */}
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "w-[130px] justify-start text-left font-normal",
                              !dateRange.from && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? format(dateRange.from, "MMM d, yy") : "From"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <span className="text-muted-foreground">-</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "w-[130px] justify-start text-left font-normal",
                              !dateRange.to && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.to ? format(dateRange.to, "MMM d, yy") : "To"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {/* Quick Date Buttons */}
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}
                      >
                        7d
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}
                      >
                        30d
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setDateRange({ from: subDays(new Date(), 90), to: new Date() })}
                      >
                        90d
                      </Button>
                    </div>
                  </div>

                  {/* Summary Statistics */}
                  {!loadingTransactions && recentTransactions && recentTransactions.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-primary/5 rounded-lg border">
                        <div className="flex items-center gap-2 text-primary">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-xs font-medium">Total Amount</span>
                        </div>
                        <p className="text-lg font-bold mt-1">₦{transactionStats.totalAmount.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg border">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-xs font-medium">Avg. Transaction</span>
                        </div>
                        <p className="text-lg font-bold mt-1">₦{Math.round(transactionStats.averageAmount).toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg border">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <ShoppingCart className="h-4 w-4" />
                          <span className="text-xs font-medium">Votes</span>
                        </div>
                        <p className="text-lg font-bold mt-1">
                          {transactionStats.byType['vote_purchase']?.count || 0}
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            (₦{(transactionStats.byType['vote_purchase']?.amount || 0).toLocaleString()})
                          </span>
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg border">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Ticket className="h-4 w-4" />
                          <span className="text-xs font-medium">Tickets</span>
                        </div>
                        <p className="text-lg font-bold mt-1">
                          {transactionStats.byType['ticket_purchase']?.count || 0}
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            (₦{(transactionStats.byType['ticket_purchase']?.amount || 0).toLocaleString()})
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loadingTransactions ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : recentTransactions && recentTransactions.length > 0 ? (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentTransactions.map((tx: any) => (
                          <TableRow key={tx.id}>
                            <TableCell className="text-sm">
                              {format(new Date(tx.created_at), 'MMM d, HH:mm')}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{tx.wallets?.profiles?.full_name || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{tx.wallets?.profiles?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {tx.type.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">
                              ₦{tx.amount?.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                tx.status === 'completed' ? 'default' :
                                tx.status === 'pending' ? 'secondary' :
                                'destructive'
                              }>
                                {tx.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {tx.reference_id?.slice(0, 15)}...
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No transactions found</p>
                  </div>
                )}
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
                        value={cryptoForm.crypto_wallet_bsc_usdt}
                        onChange={(e) => handleCryptoFormChange('crypto_wallet_bsc_usdt', e.target.value)}
                        className={cn("mt-2 font-mono text-sm", cryptoErrors.crypto_wallet_bsc_usdt && "border-destructive")}
                      />
                      {cryptoErrors.crypto_wallet_bsc_usdt && (
                        <p className="text-xs text-destructive mt-1">{cryptoErrors.crypto_wallet_bsc_usdt}</p>
                      )}
                    </div>
                    <div>
                      <Label>USDC Wallet (BEP20)</Label>
                      <Input 
                        placeholder="0x..." 
                        value={cryptoForm.crypto_wallet_bsc_usdc}
                        onChange={(e) => handleCryptoFormChange('crypto_wallet_bsc_usdc', e.target.value)}
                        className={cn("mt-2 font-mono text-sm", cryptoErrors.crypto_wallet_bsc_usdc && "border-destructive")}
                      />
                      {cryptoErrors.crypto_wallet_bsc_usdc && (
                        <p className="text-xs text-destructive mt-1">{cryptoErrors.crypto_wallet_bsc_usdc}</p>
                      )}
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
                        value={cryptoForm.crypto_wallet_ethereum_usdt}
                        onChange={(e) => handleCryptoFormChange('crypto_wallet_ethereum_usdt', e.target.value)}
                        className={cn("mt-2 font-mono text-sm", cryptoErrors.crypto_wallet_ethereum_usdt && "border-destructive")}
                      />
                      {cryptoErrors.crypto_wallet_ethereum_usdt && (
                        <p className="text-xs text-destructive mt-1">{cryptoErrors.crypto_wallet_ethereum_usdt}</p>
                      )}
                    </div>
                    <div>
                      <Label>USDC Wallet (ERC20)</Label>
                      <Input 
                        placeholder="0x..." 
                        value={cryptoForm.crypto_wallet_ethereum_usdc}
                        onChange={(e) => handleCryptoFormChange('crypto_wallet_ethereum_usdc', e.target.value)}
                        className={cn("mt-2 font-mono text-sm", cryptoErrors.crypto_wallet_ethereum_usdc && "border-destructive")}
                      />
                      {cryptoErrors.crypto_wallet_ethereum_usdc && (
                        <p className="text-xs text-destructive mt-1">{cryptoErrors.crypto_wallet_ethereum_usdc}</p>
                      )}
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
                        value={cryptoForm.crypto_wallet_polygon_usdt}
                        onChange={(e) => handleCryptoFormChange('crypto_wallet_polygon_usdt', e.target.value)}
                        className={cn("mt-2 font-mono text-sm", cryptoErrors.crypto_wallet_polygon_usdt && "border-destructive")}
                      />
                      {cryptoErrors.crypto_wallet_polygon_usdt && (
                        <p className="text-xs text-destructive mt-1">{cryptoErrors.crypto_wallet_polygon_usdt}</p>
                      )}
                    </div>
                    <div>
                      <Label>USDC Wallet</Label>
                      <Input 
                        placeholder="0x..." 
                        value={cryptoForm.crypto_wallet_polygon_usdc}
                        onChange={(e) => handleCryptoFormChange('crypto_wallet_polygon_usdc', e.target.value)}
                        className={cn("mt-2 font-mono text-sm", cryptoErrors.crypto_wallet_polygon_usdc && "border-destructive")}
                      />
                      {cryptoErrors.crypto_wallet_polygon_usdc && (
                        <p className="text-xs text-destructive mt-1">{cryptoErrors.crypto_wallet_polygon_usdc}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Tron (TRC20)</h4>
                  <div>
                    <Label>USDT Wallet (TRC20)</Label>
                    <Input 
                      placeholder="T..." 
                      value={cryptoForm.crypto_wallet_tron_usdt}
                      onChange={(e) => handleCryptoFormChange('crypto_wallet_tron_usdt', e.target.value)}
                      className={cn("mt-2 font-mono text-sm", cryptoErrors.crypto_wallet_tron_usdt && "border-destructive")}
                    />
                    {cryptoErrors.crypto_wallet_tron_usdt && (
                      <p className="text-xs text-destructive mt-1">{cryptoErrors.crypto_wallet_tron_usdt}</p>
                    )}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button 
                    onClick={saveCryptoSettings}
                    disabled={!cryptoFormDirty || isSavingCrypto}
                  >
                    {isSavingCrypto ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      <><CheckCircle className="h-4 w-4 mr-2" /> Save Wallet Addresses</>
                    )}
                  </Button>
                  {cryptoFormDirty && (
                    <span className="text-sm text-muted-foreground">You have unsaved changes</span>
                  )}
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