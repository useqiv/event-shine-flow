import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FieldLabel, RequiredFieldsNote } from '@/components/ui/required-field-label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { ContestBrandingForm } from '@/components/org/ContestBrandingForm';
import { AIDescriptionGenerator } from '@/components/org/AIDescriptionGenerator';
import CurrencySelector from '@/components/ui/currency-selector';
import { useCreateContest, useOrganizationSettings } from '@/hooks/useOrganization';
import { Calendar, DollarSign, FileText, Users, Layers, Check, Radio, Plus, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { normalizeVoteDisplayMode, type VoteDisplayMode } from '@/lib/voteDisplay';

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

type ContestType = 'single' | 'category' | null;

const CreateContest = () => {
  const navigate = useNavigate();
  const createContest = useCreateContest();
  const { data: orgSettings } = useOrganizationSettings();

  const [contestType, setContestType] = useState<ContestType>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    image_url: '',
    start_date: '',
    end_date: '',
    vote_price: 1,
    vote_amount: 1,
    vote_currency: 'USD',
    custom_slug: '',
    brand_primary_color: '#7c3aed',
    brand_secondary_color: '#f97316',
    brand_logo_url: '',
    is_live_voting: false,
    vote_display_mode: 'count' as VoteDisplayMode,
  });
  const [voteOptions, setVoteOptions] = useState<Array<{ vote_quantity: number; price: number }>>([
    { vote_quantity: 1, price: 1 },
  ]);

  // Set default currency from org settings when loaded
  useEffect(() => {
    if (orgSettings?.default_currency && !formData.vote_currency) {
      setFormData(prev => ({ ...prev, vote_currency: orgSettings.default_currency }));
    }
  }, [orgSettings]);

  // Update vote_currency when org settings load (only if still on default)
  useEffect(() => {
    if (orgSettings?.default_currency && formData.vote_currency === 'USD') {
      setFormData(prev => ({ ...prev, vote_currency: orgSettings.default_currency }));
    }
  }, [orgSettings?.default_currency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Contest title is required');
      return;
    }
    if (!formData.category) {
      toast.error('Category is required');
      return;
    }
    if (!formData.start_date) {
      toast.error('Start date is required');
      return;
    }
    if (!formData.end_date) {
      toast.error('End date is required');
      return;
    }
    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      toast.error('End date must be after start date');
      return;
    }
    if (!formData.vote_currency) {
      toast.error('Currency is required');
      return;
    }
    
    try {
      const sanitizedVoteOptions = voteOptions
        .map((option) => ({
          vote_quantity: Math.max(1, Math.floor(Number(option.vote_quantity) || 0)),
          price: Number(option.price) || 0,
        }))
        .filter((option) => option.price > 0);

      if (sanitizedVoteOptions.length === 0) {
        toast.error('Add at least one valid voting option');
        return;
      }

      const votePrice = Number(formData.vote_price) || 0;
      if (votePrice <= 0) {
        toast.error('Vote price must be greater than zero');
        return;
      }

      const result = await createContest.mutateAsync({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        image_url: formData.image_url || undefined,
        start_date: formData.start_date,
        end_date: formData.end_date,
        vote_price: votePrice,
        vote_amount: Math.min(...sanitizedVoteOptions.map((option) => option.vote_quantity)),
        vote_options: sanitizedVoteOptions,
        vote_currency: formData.vote_currency,
        custom_slug: formData.custom_slug || undefined,
        brand_primary_color: formData.brand_primary_color,
        brand_secondary_color: formData.brand_secondary_color,
        brand_logo_url: formData.brand_logo_url || undefined,
        contest_type: contestType as 'single' | 'category',
        is_live_voting: formData.is_live_voting,
        vote_display_mode: formData.vote_display_mode,
      });
      
      // If category-based, navigate to contest management to add categories
      if (contestType === 'category' && result?.id) {
        navigate(`/org/contests/${result.id}?setup=categories`);
      } else {
        navigate('/org/contests');
      }
    } catch (error) {
      console.error('Failed to create contest:', error);
      toast.error('Failed to create contest');
    }
  };
  const handleVoteOptionChange = (index: number, field: 'vote_quantity' | 'price', value: string) => {
    setVoteOptions((prev) =>
      prev.map((option, idx) =>
        idx === index
          ? {
              ...option,
              [field]: field === 'vote_quantity' ? Math.max(1, Math.floor(Number(value) || 0)) : Number(value),
            }
          : option
      )
    );
  };

  const addVoteOption = () => {
    setVoteOptions((prev) => [...prev, { vote_quantity: 1, price: 1 }]);
  };

  const removeVoteOption = (index: number) => {
    setVoteOptions((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)));
  };


  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Contest Type Selection Step
  if (contestType === null) {
    return (
      <OrganizationLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Create New Contest</h1>
            <p className="text-sm text-muted-foreground">What type of contest do you want to create?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Single Contest Option */}
            <Card 
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
                "border-2"
              )}
              onClick={() => setContestType('single')}
            >
              <CardContent className="p-6 text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Single Contest</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    All contestants compete in one pool. Best for simple voting like "Best Dressed" or "Most Popular".
                  </p>
                </div>
                <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3">
                  <strong>Example:</strong> Best Dressed 2024 with contestants Ada, Sam, John competing together.
                </div>
              </CardContent>
            </Card>

            {/* Category-based Contest Option */}
            <Card 
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
                "border-2"
              )}
              onClick={() => setContestType('category')}
            >
              <CardContent className="p-6 text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Layers className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Category-based Contest</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Multiple award categories with contestants in each. Best for award shows or multi-category events.
                  </p>
                </div>
                <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3">
                  <strong>Example:</strong> Music Awards with categories like "Best Artiste", "Best Song", "Best Album".
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-start">
            <Button variant="outline" onClick={() => navigate('/org/contests')}>
              Cancel
            </Button>
          </div>
        </div>
      </OrganizationLayout>
    );
  }

  return (
    <OrganizationLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Create New Contest</h1>
            <p className="text-sm text-muted-foreground">
              {contestType === 'category' ? 'Category-based contest' : 'Single contest'} • 
              <button 
                type="button"
                className="text-primary hover:underline ml-1"
                onClick={() => setContestType(null)}
              >
                Change type
              </button>
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              {contestType === 'single' ? (
                <Users className="h-4 w-4" />
              ) : (
                <Layers className="h-4 w-4" />
              )}
              <span>{contestType === 'single' ? 'Single' : 'Category-based'}</span>
            </div>
          </div>
        </div>

        <RequiredFieldsNote />

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
                <FieldLabel htmlFor="title" required>Contest Title</FieldLabel>
                <Input
                  id="title"
                  placeholder="e.g., Best Dressed 2024"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  <AIDescriptionGenerator
                    type="contest"
                    title={formData.title}
                    category={formData.category}
                    onGenerated={(desc) => handleChange('description', desc)}
                  />
                </div>
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
                  <FieldLabel htmlFor="category" required>Category</FieldLabel>
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
                  <FieldLabel htmlFor="start_date" required>Start Date</FieldLabel>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="end_date" required>End Date</FieldLabel>
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
              <CardDescription>
                Set the per-vote price and bundles voters can buy at checkout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <FieldLabel htmlFor="vote_currency" required>Currency</FieldLabel>
                  <CurrencySelector
                    value={formData.vote_currency}
                    onValueChange={(value) => handleChange('vote_currency', value)}
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="vote_price" required>Vote Price (per vote)</FieldLabel>
                  <Input
                    id="vote_price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.vote_price}
                    onChange={(e) => handleChange('vote_price', Number(e.target.value))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Standard price per vote on contest pages and reports.
                  </p>
                </div>
                <div className="space-y-3">
                  <FieldLabel required>Voting Options</FieldLabel>
                  <p className="text-xs text-muted-foreground">
                    Bundles at checkout (votes + total bundle price). Can differ from the per-vote price.
                  </p>
                  {voteOptions.map((option, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                      <div className="space-y-1">
                        <FieldLabel required>Number of Votes</FieldLabel>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={option.vote_quantity}
                          onChange={(e) => handleVoteOptionChange(index, 'vote_quantity', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel required>Bundle price (total)</FieldLabel>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={option.price}
                          onChange={(e) => handleVoteOptionChange(index, 'price', e.target.value)}
                          required
                        />
                      </div>
                      <Button type="button" variant="outline" size="icon" onClick={() => removeVoteOption(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="secondary" onClick={addVoteOption}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Voting Option
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Voters will choose from these vote bundles when paying.
              </p>
            </CardContent>
          </Card>

          {/* Vote display */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Public vote display</CardTitle>
              <CardDescription>How standings appear to voters on your contest page</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.vote_display_mode}
                onValueChange={(value) =>
                  handleChange('vote_display_mode', normalizeVoteDisplayMode(value))
                }
                className="grid gap-3 sm:grid-cols-2"
              >
                <label
                  htmlFor="create-vote-display-count"
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-4',
                    formData.vote_display_mode === 'count' && 'border-primary bg-primary/5'
                  )}
                >
                  <RadioGroupItem value="count" id="create-vote-display-count" className="mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-medium">Vote counts</span>
                    <p className="text-xs text-muted-foreground">Show numeric vote totals.</p>
                  </div>
                </label>
                <label
                  htmlFor="create-vote-display-progress"
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-4',
                    formData.vote_display_mode === 'progress_bar' && 'border-primary bg-primary/5'
                  )}
                >
                  <RadioGroupItem value="progress_bar" id="create-vote-display-progress" className="mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-medium">Progress bar</span>
                    <p className="text-xs text-muted-foreground">Show relative bars without exact numbers.</p>
                  </div>
                </label>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Live Voting Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Live Voting
              </CardTitle>
              <CardDescription>Enable real-time vote updates for viewers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="is_live_voting">Enable Live Voting</Label>
                  <p className="text-xs text-muted-foreground">
                    When enabled, voters will see vote counts update in real-time with animations and live leaderboards.
                  </p>
                </div>
                <Switch
                  id="is_live_voting"
                  checked={formData.is_live_voting}
                  onCheckedChange={(checked) => handleChange('is_live_voting', checked)}
                />
              </div>
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
