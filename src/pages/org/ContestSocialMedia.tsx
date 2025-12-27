import React from 'react';
import { useParams, Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SocialPostingCard } from '@/components/org/SocialPostingCard';
import { SocialAutoPostManager } from '@/components/org/SocialAutoPostManager';
import { SocialAnalyticsCard } from '@/components/org/SocialAnalyticsCard';
import { useContest, useContestants } from '@/hooks/useContests';
import { ArrowLeft, Send, Calendar, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

const ContestSocialMedia = () => {
  const { id } = useParams<{ id: string }>();
  const { data: contest, isLoading: contestLoading } = useContest(id || '');
  const { data: contestants } = useContestants(id || '');

  if (contestLoading) {
    return (
      <OrganizationLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </OrganizationLayout>
    );
  }

  if (!contest) {
    return (
      <OrganizationLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Contest not found</p>
          <Link to="/org/contests">
            <Button variant="outline" className="mt-4">
              Back to Contests
            </Button>
          </Link>
        </div>
      </OrganizationLayout>
    );
  }

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to={`/org/contests/${id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Social Media</h1>
              <p className="text-muted-foreground">
                {contest.title} • {format(new Date(contest.start_date), 'MMM d')} - {format(new Date(contest.end_date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posting" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="posting" className="gap-2">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Quick Post</span>
              <span className="sm:hidden">Post</span>
            </TabsTrigger>
            <TabsTrigger value="auto-posting" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Auto-Posting</span>
              <span className="sm:hidden">Auto</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>

          {/* Quick Post Tab */}
          <TabsContent value="posting" className="space-y-6">
            {contestants && contestants.length > 0 ? (
              <SocialPostingCard
                contest={{
                  id: contest.id,
                  title: contest.title,
                  custom_slug: (contest as any).custom_slug || null,
                  brand_primary_color: (contest as any).brand_primary_color || '#6366f1',
                }}
                contestants={contestants.map((c: any) => ({
                  id: c.id,
                  name: c.name,
                  vote_count: c.vote_count,
                  photo_url: c.photo_url,
                }))}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Add contestants to enable social posting features.
              </div>
            )}
          </TabsContent>

          {/* Auto-Posting Tab */}
          <TabsContent value="auto-posting" className="space-y-6">
            <SocialAutoPostManager
              entityId={contest.id}
              entityType="contest"
              entityTitle={contest.title}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <SocialAnalyticsCard
              contestId={contest.id}
              organizationId={(contest as any).organization_id || ''}
            />
          </TabsContent>
        </Tabs>
      </div>
    </OrganizationLayout>
  );
};

export default ContestSocialMedia;
