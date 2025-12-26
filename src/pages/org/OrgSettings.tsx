import React, { useState, useEffect } from 'react';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useOrganizationSettings, useUpdateOrganizationSettings } from '@/hooks/useOrganization';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { Building, User, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { WebhooksManager } from '@/components/org/WebhooksManager';
import { EmbedCodeGenerator } from '@/components/org/EmbedCodeGenerator';

const OrgSettings = () => {
  const { data: profile } = useProfile();
  const { data: orgSettings, isLoading } = useOrganizationSettings();
  const updateProfile = useUpdateProfile();
  const updateOrgSettings = useUpdateOrganizationSettings();

  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

  const [companyData, setCompanyData] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: '',
  });

  const [bankData, setBankData] = useState({
    bank_name: '',
    account_number: '',
    account_name: '',
    usdt_address: '',
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (orgSettings) {
      setCompanyData({
        company_name: orgSettings.company_name || '',
        company_email: orgSettings.company_email || '',
        company_phone: orgSettings.company_phone || '',
        company_address: orgSettings.company_address || '',
      });
      setBankData({
        bank_name: orgSettings.bank_name || '',
        account_number: orgSettings.account_number || '',
        account_name: orgSettings.account_name || '',
        usdt_address: orgSettings.usdt_address || '',
      });
    }
  }, [orgSettings]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync(profileData);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleSaveCompany = async () => {
    try {
      await updateOrgSettings.mutateAsync(companyData);
      toast.success('Company information saved');
    } catch (error) {
      toast.error('Failed to save company information');
    }
  };

  const handleSaveBank = async () => {
    try {
      await updateOrgSettings.mutateAsync(bankData);
      toast.success('Payment details saved');
    } catch (error) {
      toast.error('Failed to save payment details');
    }
  };

  return (
    <OrganizationLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your organization settings and preferences.</p>
        </div>

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your personal account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={profileData.full_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  disabled
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Company Information
            </CardTitle>
            <CardDescription>Your organization details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={companyData.company_name}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, company_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Company Email</Label>
                <Input
                  type="email"
                  value={companyData.company_email}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, company_email: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Company Phone</Label>
              <Input
                value={companyData.company_phone}
                onChange={(e) => setCompanyData(prev => ({ ...prev, company_phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Company Address</Label>
              <Textarea
                value={companyData.company_address}
                onChange={(e) => setCompanyData(prev => ({ ...prev, company_address: e.target.value }))}
                rows={2}
              />
            </div>
            <Button onClick={handleSaveCompany} disabled={updateOrgSettings.isPending}>
              {updateOrgSettings.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </CardTitle>
            <CardDescription>Your payout information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input
                  value={bankData.bank_name}
                  onChange={(e) => setBankData(prev => ({ ...prev, bank_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  value={bankData.account_number}
                  onChange={(e) => setBankData(prev => ({ ...prev, account_number: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input
                value={bankData.account_name}
                onChange={(e) => setBankData(prev => ({ ...prev, account_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>USDT Address (Optional)</Label>
              <Input
                value={bankData.usdt_address}
                onChange={(e) => setBankData(prev => ({ ...prev, usdt_address: e.target.value }))}
                placeholder="TRC20 or ERC20 address"
              />
            </div>
            <Button onClick={handleSaveBank} disabled={updateOrgSettings.isPending}>
              {updateOrgSettings.isPending ? 'Saving...' : 'Save Payment Details'}
            </Button>
          </CardContent>
        </Card>

        {/* Webhooks */}
        <WebhooksManager />

        {/* Embed Widget */}
        <EmbedCodeGenerator />
      </div>
    </OrganizationLayout>
  );
};

export default OrgSettings;
