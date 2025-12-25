import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateContest } from '@/hooks/useOrganization';
import { Trophy, Calendar, DollarSign, Image, FileText, Tag } from 'lucide-react';

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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createContest.mutateAsync({
        ...formData,
        vote_price: Number(formData.vote_price),
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

                <div className="space-y-2">
                  <Label htmlFor="image_url">Banner Image URL</Label>
                  <Input
                    id="image_url"
                    placeholder="https://..."
                    value={formData.image_url}
                    onChange={(e) => handleChange('image_url', e.target.value)}
                  />
                </div>
              </div>
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
              <CardDescription>Set the price per vote</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="vote_price">Price per Vote (₦) *</Label>
                <Input
                  id="vote_price"
                  type="number"
                  min="1"
                  value={formData.vote_price}
                  onChange={(e) => handleChange('vote_price', e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Users will pay this amount for each vote they cast.
                </p>
              </div>
            </CardContent>
          </Card>

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
