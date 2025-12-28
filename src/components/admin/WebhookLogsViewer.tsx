import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';
import { Webhook, Search, RefreshCw, AlertCircle, CheckCircle2, Eye } from 'lucide-react';

interface WebhookLog {
  id: string;
  webhook_name: string;
  organization_name: string;
  url: string;
  events: string[];
  is_active: boolean;
  last_triggered_at: string | null;
  failure_count: number;
}

const WebhookLogsViewer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookLog | null>(null);

  const { data: webhooks, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-webhook-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_webhooks')
        .select('*')
        .order('last_triggered_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Get organization names
      const orgIds = [...new Set(data?.map(w => w.organization_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', orgIds);

      return data?.map(webhook => ({
        id: webhook.id,
        webhook_name: webhook.name,
        organization_name: profiles?.find(p => p.id === webhook.organization_id)?.full_name || 'Unknown',
        url: webhook.url,
        events: webhook.events || [],
        is_active: webhook.is_active,
        last_triggered_at: webhook.last_triggered_at,
        failure_count: webhook.failure_count,
      })) as WebhookLog[];
    },
    refetchInterval: 30000,
  });

  const filteredWebhooks = webhooks?.filter(webhook =>
    webhook.webhook_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    webhook.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    webhook.url.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getStatusBadge = (webhook: WebhookLog) => {
    if (!webhook.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (webhook.failure_count >= 5) {
      return <Badge variant="destructive">Failed</Badge>;
    }
    if (webhook.failure_count > 0) {
      return <Badge variant="outline" className="border-orange-500 text-orange-500">Issues</Badge>;
    }
    return <Badge className="bg-green-500">Healthy</Badge>;
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
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Webhook Logs</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <CardDescription>Monitor webhook delivery status across organizations</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search webhooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4 mb-4">
            <div className="p-3 rounded-lg border">
              <p className="text-2xl font-bold">{webhooks?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Total Webhooks</p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="text-2xl font-bold text-green-600">
                {webhooks?.filter(w => w.is_active && w.failure_count === 0).length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Healthy</p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="text-2xl font-bold text-orange-600">
                {webhooks?.filter(w => w.failure_count > 0 && w.failure_count < 5).length || 0}
              </p>
              <p className="text-xs text-muted-foreground">With Issues</p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="text-2xl font-bold text-destructive">
                {webhooks?.filter(w => w.failure_count >= 5).length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Webhook</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Failures</TableHead>
                  <TableHead>Last Triggered</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWebhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{webhook.webhook_name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-xs">
                          {webhook.url}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{webhook.organization_name}</TableCell>
                    <TableCell>{getStatusBadge(webhook)}</TableCell>
                    <TableCell>
                      {webhook.failure_count > 0 ? (
                        <div className="flex items-center gap-1 text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          <span className="text-sm">{webhook.failure_count}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          <span className="text-sm">0</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {webhook.last_triggered_at ? (
                        <div>
                          <p className="text-sm">
                            {format(new Date(webhook.last_triggered_at), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(webhook.last_triggered_at), { addSuffix: true })}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedWebhook(webhook)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredWebhooks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No webhooks found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedWebhook} onOpenChange={() => setSelectedWebhook(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Webhook Details</DialogTitle>
            <DialogDescription>
              {selectedWebhook?.webhook_name}
            </DialogDescription>
          </DialogHeader>
          {selectedWebhook && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Organization</p>
                <p className="text-sm">{selectedWebhook.organization_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">URL</p>
                <p className="text-sm break-all">{selectedWebhook.url}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Events</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedWebhook.events.map((event) => (
                    <Badge key={event} variant="outline" className="text-xs">
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  {getStatusBadge(selectedWebhook)}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Failure Count</p>
                  <p className="text-sm">{selectedWebhook.failure_count}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Triggered</p>
                <p className="text-sm">
                  {selectedWebhook.last_triggered_at
                    ? format(new Date(selectedWebhook.last_triggered_at), 'PPpp')
                    : 'Never'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WebhookLogsViewer;
