import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCampaigns } from '@/hooks/useCampaigns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Users, Target, Clock, Search, Plus, TrendingUp, SlidersHorizontal } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { getBreadcrumbSchema } from '@/lib/structuredData';
import { CAMPAIGN_CATEGORIES } from '@/lib/campaignConstants';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  ...CAMPAIGN_CATEGORIES,
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'most-funded', label: 'Most Funded' },
  { value: 'least-funded', label: 'Least Funded' },
  { value: 'ending-soon', label: 'Ending Soon' },
  { value: 'most-donors', label: 'Most Donors' },
];

const Campaigns: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [goalRange, setGoalRange] = useState([0, 10000000]);
  const [progressFilter, setProgressFilter] = useState('all');
  const { data: campaigns, isLoading } = useCampaigns({ category, status: 'active' });

  const filteredAndSortedCampaigns = useMemo(() => {
    if (!campaigns) return [];

    let result = campaigns.filter(c => {
      // Search filter
      const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.short_description?.toLowerCase().includes(search.toLowerCase());
      
      // Goal range filter
      const matchesGoal = c.goal_amount >= goalRange[0] && c.goal_amount <= goalRange[1];
      
      // Progress filter
      const progress = c.goal_amount > 0 ? (c.current_amount / c.goal_amount) * 100 : 0;
      let matchesProgress = true;
      if (progressFilter === 'just-started') matchesProgress = progress < 25;
      else if (progressFilter === 'gaining-momentum') matchesProgress = progress >= 25 && progress < 75;
      else if (progressFilter === 'almost-there') matchesProgress = progress >= 75 && progress < 100;
      else if (progressFilter === 'fully-funded') matchesProgress = progress >= 100;

      return matchesSearch && matchesGoal && matchesProgress;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'most-funded':
          return b.current_amount - a.current_amount;
        case 'least-funded':
          return a.current_amount - b.current_amount;
        case 'ending-soon':
          if (!a.end_date) return 1;
          if (!b.end_date) return -1;
          return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
        case 'most-donors':
          return b.donor_count - a.donor_count;
        default: // newest
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [campaigns, search, goalRange, progressFilter, sortBy]);

  const featuredCampaigns = campaigns?.filter(c => c.is_featured).slice(0, 3);
  const activeFiltersCount = (category !== 'all' ? 1 : 0) + (progressFilter !== 'all' ? 1 : 0) + (goalRange[0] > 0 || goalRange[1] < 10000000 ? 1 : 0);

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: 'https://www.useqiv.com' },
    { name: 'Campaigns', url: 'https://www.useqiv.com/campaigns' },
  ]);

  return (
    <>
      <Helmet>
        <title>Crowdfunding Campaigns - Fund What Matters | USEQIV</title>
        <meta name="description" content="Support causes you care about or start your own fundraising campaign. Crowdfunding for medical, education, community, creative projects and more." />
        <meta name="keywords" content="crowdfunding, fundraising, donations, charity, medical fundraising, education funding, community projects" />
        <link rel="canonical" href="https://www.useqiv.com/campaigns" />
        
        <meta property="og:title" content="Crowdfunding Campaigns - Fund What Matters | USEQIV" />
        <meta property="og:description" content="Support causes you care about or start your own fundraising campaign on USEQIV." />
        <meta property="og:url" content="https://www.useqiv.com/campaigns" />
        <meta property="og:type" content="website" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Crowdfunding Campaigns | USEQIV" />
        <meta name="twitter:description" content="Support causes you care about on USEQIV." />

        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-4" variant="secondary">
                <Heart className="h-3 w-3 mr-1" />
                Crowdfunding
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Fund What Matters
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Support causes you care about or start your own fundraising campaign. 
                Every contribution makes a difference.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <>
                    <Button asChild size="lg">
                      <Link to="/campaigns/create">
                        <Plus className="h-5 w-5 mr-2" />
                        Start a Campaign
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild>
                      <Link to="/campaigns/my">
                        <Heart className="h-5 w-5 mr-2" />
                        My Campaigns
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button asChild size="lg">
                    <Link to="/auth">
                      <Plus className="h-5 w-5 mr-2" />
                      Sign in to Start
                    </Link>
                  </Button>
                )}
                <Button variant="outline" size="lg" asChild>
                  <a href="#campaigns">
                    <Search className="h-5 w-5 mr-2" />
                    Browse Campaigns
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Campaigns */}
        {featuredCampaigns && featuredCampaigns.length > 0 && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Featured Campaigns</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {featuredCampaigns.map(campaign => (
                  <CampaignCard key={campaign.id} campaign={campaign} featured />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Campaigns */}
        <section id="campaigns" className="py-12">
          <div className="container mx-auto px-4">
            {/* Filters */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search campaigns..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filter Campaigns</SheetTitle>
                      <SheetDescription>
                        Narrow down campaigns to find exactly what you're looking for
                      </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-6 mt-6">
                      {/* Progress Filter */}
                      <div className="space-y-3">
                        <Label>Funding Progress</Label>
                        <Select value={progressFilter} onValueChange={setProgressFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Any progress" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any Progress</SelectItem>
                            <SelectItem value="just-started">Just Started (&lt;25%)</SelectItem>
                            <SelectItem value="gaining-momentum">Gaining Momentum (25-75%)</SelectItem>
                            <SelectItem value="almost-there">Almost There (75-100%)</SelectItem>
                            <SelectItem value="fully-funded">Fully Funded (100%+)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Goal Range */}
                      <div className="space-y-3">
                        <Label>Goal Amount Range</Label>
                        <div className="pt-2">
                          <Slider
                            value={goalRange}
                            onValueChange={setGoalRange}
                            min={0}
                            max={10000000}
                            step={100000}
                            className="mb-2"
                          />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>₦{goalRange[0].toLocaleString()}</span>
                            <span>₦{goalRange[1].toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Reset Filters */}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setCategory('all');
                          setProgressFilter('all');
                          setGoalRange([0, 10000000]);
                          setSortBy('newest');
                        }}
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              
              {/* Active filters display */}
              {(category !== 'all' || progressFilter !== 'all') && (
                <div className="flex flex-wrap gap-2">
                  {category !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {CATEGORIES.find(c => c.value === category)?.label}
                      <button onClick={() => setCategory('all')} className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  )}
                  {progressFilter !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {progressFilter === 'just-started' && 'Just Started'}
                      {progressFilter === 'gaining-momentum' && 'Gaining Momentum'}
                      {progressFilter === 'almost-there' && 'Almost There'}
                      {progressFilter === 'fully-funded' && 'Fully Funded'}
                      <button onClick={() => setProgressFilter('all')} className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Campaign Grid */}
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i}>
                    <Skeleton className="h-48 rounded-t-lg" />
                    <CardContent className="pt-4 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-2 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredAndSortedCampaigns && filteredAndSortedCampaigns.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedCampaigns.map(campaign => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            ) : (
              <Card className="py-12">
                <CardContent className="text-center">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
                  <p className="text-muted-foreground mb-4">
                    {search ? 'Try adjusting your search terms or filters' : 'Be the first to start a campaign!'}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {(search || category !== 'all' || progressFilter !== 'all') && (
                      <Button variant="outline" onClick={() => {
                        setSearch('');
                        setCategory('all');
                        setProgressFilter('all');
                        setGoalRange([0, 10000000]);
                      }}>
                        Clear Filters
                      </Button>
                    )}
                    {user && (
                      <Button asChild>
                        <Link to="/campaigns/create">Start a Campaign</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>

      <Footer />
      </div>
    </>
  );
};

interface CampaignCardProps {
  campaign: any;
  featured?: boolean;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, featured }) => {
  const progress = campaign.goal_amount > 0 
    ? Math.min((campaign.current_amount / campaign.goal_amount) * 100, 100) 
    : 0;
  
  const isEnded = campaign.end_date && isPast(new Date(campaign.end_date));
  const timeLeft = campaign.end_date 
    ? formatDistanceToNow(new Date(campaign.end_date), { addSuffix: true })
    : null;

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${featured ? 'border-primary/50' : ''}`}>
      <Link to={`/campaigns/${campaign.id}`}>
        <div className="relative h-48 bg-muted">
          {campaign.image_url ? (
            <img 
              src={campaign.image_url} 
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Heart className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
          {featured && (
            <Badge className="absolute top-2 left-2 bg-primary">Featured</Badge>
          )}
          <Badge variant="secondary" className="absolute top-2 right-2">
            {campaign.category}
          </Badge>
        </div>
      </Link>
      
      <CardHeader className="pb-2">
        <Link to={`/campaigns/${campaign.id}`}>
          <CardTitle className="line-clamp-1 hover:text-primary transition-colors">
            {campaign.title}
          </CardTitle>
        </Link>
        <CardDescription className="line-clamp-2">
          {campaign.short_description || campaign.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">
              {campaign.currency} {Number(campaign.current_amount).toLocaleString()}
            </span>
            <span className="text-muted-foreground">
              of {campaign.currency} {Number(campaign.goal_amount).toLocaleString()}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{campaign.donor_count} donors</span>
          </div>
          {timeLeft && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{isEnded ? 'Ended' : timeLeft}</span>
            </div>
          )}
        </div>
        
        <Button asChild className="w-full" variant={isEnded ? 'secondary' : 'default'} disabled={isEnded}>
          <Link to={`/campaigns/${campaign.id}`}>
            {isEnded ? 'View Campaign' : 'Donate Now'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default Campaigns;
