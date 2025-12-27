import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCampaign } from '@/hooks/useCampaigns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Heart, CalendarIcon, ArrowLeft, Loader2, Target, FileText, Image } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'medical', label: 'Medical & Health' },
  { value: 'education', label: 'Education' },
  { value: 'community', label: 'Community' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'creative', label: 'Creative Projects' },
  { value: 'charity', label: 'Charity' },
  { value: 'sports', label: 'Sports' },
  { value: 'other', label: 'Other' },
];

const CURRENCIES = ['USD', 'NGN', 'GBP', 'EUR'];

const CreateCampaign: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createCampaign = useCreateCampaign();

  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    description: '',
    goal_amount: '',
    currency: 'USD',
    category: '',
    image_url: '',
    end_date: undefined as Date | undefined,
  });

  const [step, setStep] = useState(1);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in to create a campaign</h1>
          <p className="text-muted-foreground mb-4">You need to be signed in to start a fundraising campaign.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = async (asDraft: boolean = false) => {
    if (!formData.title || !formData.category || !formData.goal_amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const campaign = await createCampaign.mutateAsync({
        title: formData.title,
        short_description: formData.short_description || null,
        description: formData.description || null,
        goal_amount: parseFloat(formData.goal_amount),
        currency: formData.currency,
        category: formData.category,
        image_url: formData.image_url || null,
        end_date: formData.end_date?.toISOString() || null,
        status: asDraft ? 'draft' : 'active',
      });

      navigate(`/campaigns/${campaign.id}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate('/campaigns')} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>

          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <Heart className="h-12 w-12 mx-auto text-primary mb-4" />
              <h1 className="text-3xl font-bold mb-2">Start a Campaign</h1>
              <p className="text-muted-foreground">
                Create a fundraising campaign and start collecting donations
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-4">
                {[1, 2, 3].map((s) => (
                  <React.Fragment key={s}>
                    <div 
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                        step >= s 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {s}
                    </div>
                    {s < 3 && (
                      <div className={cn(
                        "w-12 h-0.5",
                        step > s ? "bg-primary" : "bg-muted"
                      )} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>Tell us about your campaign</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Campaign Title *</Label>
                    <Input
                      id="title"
                      placeholder="Give your campaign a clear, descriptive title"
                      value={formData.title}
                      onChange={(e) => updateField('title', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(v) => updateField('category', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="short_description">Short Description</Label>
                    <Textarea
                      id="short_description"
                      placeholder="A brief summary that appears in campaign listings (1-2 sentences)"
                      value={formData.short_description}
                      onChange={(e) => updateField('short_description', e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Full Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell your story. Why are you fundraising? How will the funds be used?"
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      rows={6}
                    />
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => setStep(2)}
                    disabled={!formData.title || !formData.category}
                  >
                    Continue
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Funding Goal */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Funding Goal
                  </CardTitle>
                  <CardDescription>Set your fundraising target</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="goal">Goal Amount *</Label>
                      <Input
                        id="goal"
                        type="number"
                        placeholder="0.00"
                        value={formData.goal_amount}
                        onChange={(e) => updateField('goal_amount', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={formData.currency} onValueChange={(v) => updateField('currency', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map(curr => (
                            <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date (Optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.end_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.end_date ? format(formData.end_date, "PPP") : "No end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.end_date}
                          onSelect={(date) => updateField('end_date', date)}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">
                      Leave empty for an ongoing campaign with no deadline
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                      Back
                    </Button>
                    <Button 
                      className="flex-1" 
                      onClick={() => setStep(3)}
                      disabled={!formData.goal_amount}
                    >
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Media & Launch */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Media & Launch
                  </CardTitle>
                  <CardDescription>Add an image and launch your campaign</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="image_url">Cover Image URL</Label>
                    <Input
                      id="image_url"
                      placeholder="https://example.com/image.jpg"
                      value={formData.image_url}
                      onChange={(e) => updateField('image_url', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste a URL to an image. Recommended size: 1200x630 pixels
                    </p>
                  </div>

                  {formData.image_url && (
                    <div className="rounded-lg overflow-hidden bg-muted aspect-video">
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Summary */}
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <h4 className="font-medium mb-3">Campaign Summary</h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Title:</dt>
                          <dd className="font-medium">{formData.title}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Category:</dt>
                          <dd>{CATEGORIES.find(c => c.value === formData.category)?.label}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Goal:</dt>
                          <dd className="font-medium">{formData.currency} {formData.goal_amount}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">End Date:</dt>
                          <dd>{formData.end_date ? format(formData.end_date, 'PP') : 'No deadline'}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                      Back
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => handleSubmit(true)}
                      disabled={createCampaign.isPending}
                    >
                      Save as Draft
                    </Button>
                    <Button 
                      onClick={() => handleSubmit(false)}
                      disabled={createCampaign.isPending}
                      className="flex-1"
                    >
                      {createCampaign.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Launching...
                        </>
                      ) : (
                        <>
                          <Heart className="h-4 w-4 mr-2" />
                          Launch Campaign
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreateCampaign;
