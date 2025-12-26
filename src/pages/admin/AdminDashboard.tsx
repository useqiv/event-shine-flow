import React from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminStatistics } from '@/hooks/useAdminData';
import { useRealtimePayments } from '@/hooks/useRealtimePayments';
import PaymentStatsWidget from '@/components/admin/PaymentStatsWidget';
import { 
  Users, 
  Building2, 
  Trophy, 
  Calendar, 
  Wallet, 
  AlertTriangle, 
  FileCheck, 
  BarChart3,
  TrendingUp,
  Vote,
  Ticket,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  description,
  trend,
  href 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType;
  description?: string;
  trend?: string;
  href?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          <TrendingUp className="h-3 w-3 text-green-500" />
          <span className="text-xs text-green-500">{trend}</span>
        </div>
      )}
      {href && (
        <Link to={href} className="mt-3 inline-flex items-center text-xs text-primary hover:underline">
          View details <ArrowRight className="h-3 w-3 ml-1" />
        </Link>
      )}
    </CardContent>
  </Card>
);

const AlertCard = ({ 
  title, 
  count, 
  variant, 
  href 
}: { 
  title: string; 
  count: number; 
  variant: 'default' | 'destructive' | 'warning';
  href: string;
}) => (
  <Card className={count > 0 ? 'border-destructive/50' : ''}>
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Badge variant={count > 0 ? 'destructive' : 'secondary'}>
          {count}
        </Badge>
      </div>
    </CardHeader>
    <CardContent>
      <Link to={href}>
        <Button variant="outline" size="sm" className="w-full">
          {count > 0 ? 'Review Now' : 'View All'}
        </Button>
      </Link>
    </CardContent>
  </Card>
);

const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading } = useAdminStatistics();
  
  // Enable real-time payment notifications
  useRealtimePayments();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>

          {/* Key Stats Grid Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-20 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Revenue Stats Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Alerts Section Skeleton */}
          <div>
            <Skeleton className="h-6 w-36 mb-4" />
            <div className="grid gap-4 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-8 rounded-full" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-9 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Actions Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-1" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Admin Overview</h1>
          <p className="text-muted-foreground">Platform management dashboard</p>
        </div>

        {/* Key Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={stats?.total_users || 0}
            icon={Users}
            description="Registered users"
            href="/admin/users"
          />
          <StatCard
            title="Organizations"
            value={stats?.total_organizations || 0}
            icon={Building2}
            description="Registered companies"
            href="/admin/organizations"
          />
          <StatCard
            title="Active Contests"
            value={stats?.active_contests || 0}
            icon={Trophy}
            description="Currently running"
            href="/admin/contests"
          />
          <StatCard
            title="Active Events"
            value={stats?.active_events || 0}
            icon={Calendar}
            description="Upcoming events"
            href="/admin/events"
          />
        </div>

        {/* Revenue Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats?.total_revenue || 0)}
            icon={DollarSign}
            description="Platform earnings"
            href="/admin/finance"
          />
          <StatCard
            title="Pending Payouts"
            value={formatCurrency(stats?.pending_payouts || 0)}
            icon={Wallet}
            description="Awaiting approval"
            href="/admin/payouts"
          />
          <StatCard
            title="Total Votes"
            value={stats?.total_votes?.toLocaleString() || 0}
            icon={Vote}
            description="Votes generated"
          />
          <StatCard
            title="Tickets Sold"
            value={stats?.total_tickets_sold?.toLocaleString() || 0}
            icon={Ticket}
            description="Total tickets"
          />
        </div>

        {/* Alerts Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Pending Actions</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <AlertCard
              title="Fraud Alerts"
              count={stats?.pending_fraud_alerts || 0}
              variant="destructive"
              href="/admin/fraud"
            />
            <AlertCard
              title="Content Reviews"
              count={stats?.pending_content_reviews || 0}
              variant="warning"
              href="/admin/moderation"
            />
            <AlertCard
              title="Org Approvals"
              count={stats?.pending_org_approvals || 0}
              variant="default"
              href="/admin/organizations"
            />
          </div>
        </div>

        {/* Payment Statistics Widget */}
        <PaymentStatsWidget />
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Link to="/admin/users">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Users className="h-4 w-4" />
                  Manage Users
                </Button>
              </Link>
              <Link to="/admin/payouts">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Wallet className="h-4 w-4" />
                  Process Payouts
                </Button>
              </Link>
              <Link to="/admin/fraud">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Review Fraud
                </Button>
              </Link>
              <Link to="/admin/settings">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Platform Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;