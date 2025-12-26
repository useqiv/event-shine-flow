import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { ContestBrandingForm } from '@/components/org/ContestBrandingForm';
import { useCreateContest } from '@/hooks/useOrganization';
import { Calendar, DollarSign, FileText } from 'lucide-react';

const categories = [
  'Music',
  'Beauty',
  'Fashion',
  'Sports',
  'Talent',
  'Dance',
  'Photography',
  'Art',
  'Tech',
  'Other'
];

const currencies = [
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
];

const CreateContest = () => {
  const navigate = useNavigate();
  const createContest = useCreateContest();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    image_url: '',
    start_date: '',
    end_date: '',
    vote_price: 100,
    vote_currency: 'NGN',
    custom_slug: '',
    brand_primary_color: '#7c3aed',
    brand_secondary_color: '#f97316',
    brand_logo_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createContest.mutateAsync({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        image_url: formData.image_url || undefined,
        start_date: formData.start_date,
        end_date: formData.end_date,
        vote_price: Number(formData.vote_price),
        vote_currency: formData.vote_currency,
        custom_slug: formData.custom_slug || undefined,
        brand_primary_color: formData.brand_primary_color,
        brand_secondary_color: formData.brand_secondary_color,
        brand_logo_url: formData.brand_logo_url || undefined,
      });
      navigate('/org/contests');
    } catch (error) {
      console.error('Failed to create contest:', error);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <OrganizationLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create New Contest</h1>
          <p className="text-muted-foreground">Set up a voting contest for your audience.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contest Details
              </CardTitle>
              <CardDescription>Basic information about your contest</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Contest Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Best Dressed 2024"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your contest..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleChange('category', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ImageUpload
                bucket="contest-images"
                value={formData.image_url}
                onChange={(url) => handleChange('image_url', url)}
                label="Contest Banner Image"
              />
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
              <CardDescription>When should the contest run?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Vote Pricing
              </CardTitle>
              <CardDescription>Set the price and currency per vote</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vote_currency">Currency *</Label>
                  <Select
                    value={formData.vote_currency}
                    onValueChange={(value) => handleChange('vote_currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vote_price">Price per Vote *</Label>
                  <Input
                    id="vote_price"
                    type="number"
                    min="1"
                    value={formData.vote_price}
                    onChange={(e) => handleChange('vote_price', e.target.value)}
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Users will pay this amount for each vote they cast.
              </p>
            </CardContent>
          </Card>

          {/* Branding */}
          <ContestBrandingForm
            values={{
              custom_slug: formData.custom_slug,
              brand_primary_color: formData.brand_primary_color,
              brand_secondary_color: formData.brand_secondary_color,
              brand_logo_url: formData.brand_logo_url,
            }}
            onChange={handleChange}
          />

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/org/contests')}>
              Cancel
            </Button>
            <Button type="submit" disabled={createContest.isPending}>
              {createContest.isPending ? 'Creating...' : 'Create Contest'}
            </Button>
          </div>
        </form>
      </div>
    </OrganizationLayout>
  );
};

export default CreateContest;
