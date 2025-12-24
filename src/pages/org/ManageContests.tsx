import React from 'react';
import { Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganizationContests } from '@/hooks/useOrganization';
import { Trophy, PlusCircle, Calendar, Vote, Eye, Settings } from 'lucide-react';
import { format } from 'date-fns';

const ManageContests = () => {
  const { data: contests, isLoading } = useOrganizationContests();

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manage Contests</h1>
            <p className="text-muted-foreground">View and manage all your voting contests.</p>
          </div>
          <Link to="/org/contests/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Contest
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : contests && contests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contests.map((contest: any) => (
              <Card key={contest.id} className="overflow-hidden">
                <div className="h-32 bg-secondary">
                  {contest.image_url ? (
                    <img
                      src={contest.image_url}
                      alt={contest.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Trophy className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold truncate">{contest.title}</h3>
                    <Badge variant={contest.is_active ? "default" : "secondary"}>
                      {contest.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(contest.start_date), 'MMM d')} - {format(new Date(contest.end_date), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Vote className="h-4 w-4" />
                      <span>{contest.total_votes.toLocaleString()} votes</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/org/contests/${contest.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        Manage
                      </Button>
                    </Link>
                    <Link to={`/contests/${contest.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Contests Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first contest to start collecting votes.
              </p>
              <Link to="/org/contests/create">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Contest
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </OrganizationLayout>
  );
};

export default ManageContests;
