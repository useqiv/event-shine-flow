import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, AlertTriangle, Users, Wallet, Shield, CheckCircle, ArrowRight, Vote } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface AdminNotification {
  id: string;
  type: 'fraud' | 'payout' | 'org_approval' | 'content' | 'poll' | 'system';
  title: string;
  message: string;
  link: string;
  created_at: string;
  severity: 'low' | 'medium' | 'high';
}

const AdminNotificationCenter: React.FC = () => {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const items: AdminNotification[] = [];

      // Get pending fraud alerts
      const { data: fraudAlerts } = await supabase
        .from('fraud_alerts')
        .select('id, alert_type, description, created_at, severity')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3);

      fraudAlerts?.forEach(alert => {
        items.push({
          id: `fraud-${alert.id}`,
          type: 'fraud',
          title: 'Fraud Alert',
          message: alert.description,
          link: '/admin/fraud',
          created_at: alert.created_at,
          severity: alert.severity as 'high' | 'medium' | 'low',
        });
      });

      // Get pending payouts
      const { data: payouts } = await supabase
        .from('payouts')
        .select('id, amount, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3);

      payouts?.forEach(payout => {
        items.push({
          id: `payout-${payout.id}`,
          type: 'payout',
          title: 'Pending Payout',
          message: `₦${payout.amount.toLocaleString()} payout request`,
          link: '/admin/payouts',
          created_at: payout.created_at,
          severity: 'medium',
        });
      });

      // Get pending org approvals
      const { data: approvals } = await supabase
        .from('organization_approvals')
        .select('id, organization_id, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3);

      approvals?.forEach(approval => {
        items.push({
          id: `org-${approval.id}`,
          type: 'org_approval',
          title: 'Organization Approval',
          message: 'New organization pending approval',
          link: '/admin/organizations',
          created_at: approval.created_at,
          severity: 'low',
        });
      });

      // Get pending poll approvals
      const { data: polls } = await supabase
        .from('forms')
        .select('id, title, created_at')
        .eq('form_type', 'poll')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3);

      polls?.forEach((poll) => {
        items.push({
          id: `poll-${poll.id}`,
          type: 'poll',
          title: 'Poll Approval',
          message: `"${poll.title}" needs approval before going live`,
          link: '/admin/polls',
          created_at: poll.created_at,
          severity: 'medium',
        });
      });

      // Get pending content moderation
      const { data: content } = await supabase
        .from('content_moderation')
        .select('id, content_type, entity_type, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3);

      content?.forEach(item => {
        items.push({
          id: `content-${item.id}`,
          type: 'content',
          title: 'Content Review',
          message: `${item.content_type} for ${item.entity_type} needs review`,
          link: '/admin/moderation',
          created_at: item.created_at,
          severity: 'low',
        });
      });

      // Sort by created_at descending
      return items.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 6);
    },
    refetchInterval: 30000,
  });

  const getIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'fraud': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'payout': return <Wallet className="h-4 w-4 text-primary" />;
      case 'org_approval': return <Users className="h-4 w-4 text-blue-500" />;
      case 'poll': return <Vote className="h-4 w-4 text-orange-500" />;
      case 'content': return <Shield className="h-4 w-4 text-orange-500" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityBadge = (severity: AdminNotification['severity']) => {
    switch (severity) {
      case 'high': return <Badge variant="destructive" className="text-xs">High</Badge>;
      case 'medium': return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Notifications</CardTitle>
            {notifications && notifications.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {notifications.length}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>Items requiring your attention</CardDescription>
      </CardHeader>
      <CardContent>
        {notifications && notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                to={notification.link}
                className="block p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{notification.title}</p>
                      {getSeverityBadge(notification.severity)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs">No pending items requiring attention</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminNotificationCenter;
