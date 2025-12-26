import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useWebhooks, useCreateWebhook, useUpdateWebhook, useDeleteWebhook, useWebhookLogs, useTestWebhook, WEBHOOK_EVENTS } from '@/hooks/useWebhooks';
import { Webhook, Globe, Plus, Trash2, Send, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

export const WebhooksManager: React.FC = () => {
  const { data: webhooks, isLoading } = useWebhooks();
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const testWebhook = useTestWebhook();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    secret: '',
    events: [] as string[],
  });

  const handleCreateWebhook = async () => {
    await createWebhook.mutateAsync({
      name: formData.name,
      url: formData.url,
      secret: formData.secret || undefined,
      events: formData.events,
    });
    setFormData({ name: '', url: '', secret: '', events: [] });
    setDialogOpen(false);
  };

  const handleToggleEvent = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  const handleToggleActive = async (webhook: { id: string; is_active: boolean }) => {
    await updateWebhook.mutateAsync({
      id: webhook.id,
      is_active: !webhook.is_active,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhooks
            </CardTitle>
            <CardDescription>
              Receive real-time notifications about votes, ticket sales, and payouts
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Webhook</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-name">Name</Label>
                  <Input
                    id="webhook-name"
                    placeholder="e.g., My Server"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Endpoint URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://your-server.com/webhook"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook-secret">Secret (Optional)</Label>
                  <Input
                    id="webhook-secret"
                    placeholder="Used to verify webhook authenticity"
                    value={formData.secret}
                    onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    If provided, webhooks will include an X-Webhook-Signature header
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Events to Subscribe</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {WEBHOOK_EVENTS.map((event) => (
                      <div key={event.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={event.value}
                          checked={formData.events.includes(event.value)}
                          onCheckedChange={() => handleToggleEvent(event.value)}
                        />
                        <label htmlFor={event.value} className="text-sm cursor-pointer">
                          {event.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateWebhook}
                    disabled={!formData.name || !formData.url || formData.events.length === 0 || createWebhook.isPending}
                  >
                    {createWebhook.isPending ? 'Creating...' : 'Create Webhook'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : webhooks && webhooks.length > 0 ? (
          <Accordion type="single" collapsible className="space-y-2">
            {webhooks.map((webhook) => (
              <AccordionItem key={webhook.id} value={webhook.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3 flex-1">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{webhook.name}</span>
                        {webhook.is_active ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {webhook.failure_count > 0 && (
                          <Badge variant="destructive">{webhook.failure_count} failures</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {webhook.url}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="secondary">{event}</Badge>
                      ))}
                    </div>
                    
                    {webhook.last_triggered_at && (
                      <p className="text-sm text-muted-foreground">
                        Last triggered {formatDistanceToNow(new Date(webhook.last_triggered_at))} ago
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={webhook.is_active}
                          onCheckedChange={() => handleToggleActive(webhook)}
                        />
                        <span className="text-sm">{webhook.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedWebhookId(selectedWebhookId === webhook.id ? null : webhook.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Logs
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testWebhook.mutate(webhook.id)}
                          disabled={testWebhook.isPending}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Test
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteWebhook.mutate(webhook.id)}
                          disabled={deleteWebhook.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {selectedWebhookId === webhook.id && (
                      <WebhookLogsSection webhookId={webhook.id} />
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Webhook className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No webhooks configured</p>
            <p className="text-sm">Add a webhook to receive real-time notifications</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const WebhookLogsSection: React.FC<{ webhookId: string }> = ({ webhookId }) => {
  const { data: logs, isLoading } = useWebhookLogs(webhookId);

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground border rounded-lg">
        No webhook logs yet
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
      {logs.map((log) => (
        <div key={log.id} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
          {log.success ? (
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
          )}
          <span className="font-mono text-xs">{log.event_type}</span>
          {log.response_status && (
            <Badge variant={log.success ? 'outline' : 'destructive'} className="ml-auto">
              {log.response_status}
            </Badge>
          )}
          <span className="text-muted-foreground text-xs">
            {formatDistanceToNow(new Date(log.created_at))} ago
          </span>
        </div>
      ))}
    </div>
  );
};
