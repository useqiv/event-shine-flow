import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAdminActivityLogs } from '@/hooks/useAdminActivityLog';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { History, UserX, UserCheck, CheckCircle, XCircle, Shield, Settings, Edit, ArrowRight } from 'lucide-react';

const RecentActivityWidget: React.FC = () => {
  const { data: logs, isLoading } = useAdminActivityLogs(5);

  const getActionIcon = (actionType: string) => {
    if (actionType.includes('suspend')) return <UserX className="h-4 w-4 text-destructive" />;
    if (actionType.includes('activate')) return <UserCheck className="h-4 w-4 text-green-500" />;
    if (actionType.includes('approve')) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (actionType.includes('reject')) return <XCircle className="h-4 w-4 text-destructive" />;
    if (actionType.includes('setting')) return <Settings className="h-4 w-4 text-muted-foreground" />;
    if (actionType.includes('update') || actionType.includes('edit')) return <Edit className="h-4 w-4 text-blue-500" />;
    return <Shield className="h-4 w-4 text-primary" />;
  };

  const getActionBadge = (actionType: string) => {
    if (actionType.includes('suspend') || actionType.includes('reject') || actionType.includes('delete')) {
      return <Badge variant="destructive" className="text-xs">{actionType.replace(/_/g, ' ')}</Badge>;
    }
    if (actionType.includes('approve') || actionType.includes('activate')) {
      return <Badge className="bg-green-500 text-xs">{actionType.replace(/_/g, ' ')}</Badge>;
    }
    return <Badge variant="outline" className="text-xs">{actionType.replace(/_/g, ' ')}</Badge>;
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
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
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
            <History className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </div>
          <Link to="/admin/activity">
            <Button variant="ghost" size="sm" className="text-xs">
              View All
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
        <CardDescription>Latest admin actions</CardDescription>
      </CardHeader>
      <CardContent>
        {logs && logs.length > 0 ? (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={log.admin?.avatar_url || ''} />
                  <AvatarFallback className="text-xs">
                    {log.admin?.full_name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">
                      {log.admin?.full_name || 'Admin'}
                    </span>
                    {getActionIcon(log.action_type)}
                    {getActionBadge(log.action_type)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {log.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivityWidget;
