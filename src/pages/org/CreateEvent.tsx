import React, { useState } from 'react';
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
import { CustomSlugInput, validateCustomSlug } from '@/components/ui/custom-slug-input';
import { useCreateEvent } from '@/hooks/useOrganization';
import { EventTemplateSelector } from '@/components/org/EventTemplateSelector';
import { AIDescriptionGenerator } from '@/components/org/AIDescriptionGenerator';
import { Calendar, MapPin, FileText, Link as LinkIcon, Banknote, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { AFRICAN_COUNTRIES, detectCountryFromText } from '@/lib/africanCountries';

const currencies = [
  { code: 'NGN', label: 'Nigerian Naira (₦)' },
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GHS', label: 'Ghanaian Cedi (₵)' },
  { code: 'KES', label: 'Kenyan Shilling (KSh)' },
  { code: 'ZAR', label: 'South African Rand (R)' },
];

const categories = [
  'Music',
  'Party',
  'Conference',
  'Workshop',
  'Sports',
  'Festival',
  'Networking',
  'Concert',
  'Exhibition',
  'Other'
];

const CreateEvent = () => {
  const navigate = useNavigate();
  const createEvent = useCreateEvent();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    currency: 'NGN',
    image_url: '',
    event_date: '',
    venue: '',
    address: '',
    custom_slug: '',
    country: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Event title is required');
      return;
    }
    if (!formData.category) {
      toast.error('Category is required');
      return;
    }
    if (!formData.currency) {
      toast.error('Currency is required');
      return;
    }
    if (!formData.event_date) {
      toast.error('Event date and time is required');
      return;
    }
    if (!formData.country) {
      toast.error('Country is required');
      return;
    }
    if (!formData.venue.trim()) {
      toast.error('Venue name is required');
      return;
    }
    
    // Validate custom slug
    const slugError = validateCustomSlug(formData.custom_slug);
    if (slugError) {
      toast.error(slugError);
      return;
    }
    
    try {
      await createEvent.mutateAsync({
        ...formData,
        custom_slug: formData.custom_slug || undefined,
      });
      navigate('/org/events');
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-detect country when venue or address changes
      if ((field === 'venue' || field === 'address') && !prev.country) {
        const detected = detectCountryFromText(value);
        if (detected) updated.country = detected;
      }
      return updated;
    });
  };

  return (
    <OrganizationLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Create New Event</h1>
            <p className="text-sm text-muted-foreground">Set up an event and sell tickets.</p>
          </div>
          <EventTemplateSelector
            currentData={{ title: formData.title, description: formData.description, category: formData.category, image_url: formData.image_url, venue: formData.venue, address: formData.address }}
            onLoadTemplate={(data) => setFormData(prev => ({ ...prev, ...data }))}
          />
        </div>

        <RequiredFieldsNote />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Event Details
              </CardTitle>
              <CardDescription>Basic information about your event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <FieldLabel htmlFor="title" required>Event Title</FieldLabel>
                <Input
                  id="title"
                  placeholder="e.g., Summer Music Festival"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  <AIDescriptionGenerator
                    type="event"
                    title={formData.title}
                    category={formData.category}
                    venue={formData.venue}
                    eventDate={formData.event_date}
                    onGenerated={(desc) => handleChange('description', desc)}
                  />
                </div>
                <Textarea
                  id="description"
                  placeholder="Describe your event..."
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

                <div className="space-y-2">
                  <FieldLabel htmlFor="currency" required>Currency</FieldLabel>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleChange('currency', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>{curr.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ImageUpload
                bucket="event-images"
                value={formData.image_url}
                onChange={(url) => handleChange('image_url', url)}
                label="Event Banner Image"
              />
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date & Time
              </CardTitle>
              <CardDescription>When is your event happening?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <FieldLabel htmlFor="event_date" required>Event Date & Time</FieldLabel>
                <Input
                  id="event_date"
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(e) => handleChange('event_date', e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
              <CardDescription>Where is your event taking place?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <FieldLabel htmlFor="country" required>Country</FieldLabel>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleChange('country', value)}
                  required
                >
                  <SelectTrigger>
                    <Globe className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {AFRICAN_COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="venue" required>Venue Name</FieldLabel>
                <Input
                  id="venue"
                  placeholder="e.g., Eko Convention Center"
                  value={formData.venue}
                  onChange={(e) => handleChange('venue', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Full Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter the full address..."
                  rows={2}
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Custom URL */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Custom URL
              </CardTitle>
              <CardDescription>Set a custom URL for your event (optional)</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomSlugInput
                value={formData.custom_slug}
                onChange={(value) => handleChange('custom_slug', value)}
                entityType="event"
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/org/events')}>
              Cancel
            </Button>
            <Button type="submit" disabled={createEvent.isPending}>
              {createEvent.isPending ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>

        <Card className="bg-secondary/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong>Next steps:</strong> After creating your event, you'll be able to add ticket types with different prices and quantities.
            </p>
          </CardContent>
        </Card>
      </div>
    </OrganizationLayout>
  );
};

export default CreateEvent;
