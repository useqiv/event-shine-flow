import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useFraudAlerts, useResolveFraudAlert } from '@/hooks/useAdminData';
import { 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  XCircle,
  Eye,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const AdminFraud: React.FC = () => {
  const { data: alerts, isLoading } = useFraudAlerts();
  const resolveAlert = useResolveFraudAlert();

  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolveAction, setResolveAction] = useState<'resolved' | 'dismissed'>('resolved');

  const pendingAlerts = alerts?.filter(a => a.status === 'pending') || [];
  const investigatingAlerts = alerts?.filter(a => a.status === 'investigating') || [];
  const resolvedAlerts = alerts?.filter(a => a.status === 'resolved' || a.status === 'dismissed') || [];

  const handleResolve = async () => {
    if (!selectedAlert) return;
    await resolveAlert.mutateAsync({
      alertId: selectedAlert.id,
      status: resolveAction,
      notes: resolutionNotes
    });
    setResolveDialogOpen(false);
    setResolutionNotes('');
    setSelectedAlert(null);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'suspicious_votes':
      case 'rapid_votes':
      case 'bulk_votes':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'duplicate_device':
      case 'duplicate_ticket':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'refund_abuse':
      case 'blacklisted_card':
        return <Shield className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const AlertsTable = ({ alerts }: { alerts: any[] }) => (
    <div className="rounded-md border overflow-x-auto">
      <Table className="min-w-[650px]">
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead className="hidden sm:table-cell">Description</TableHead>
            <TableHead className="hidden md:table-cell">Entity</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead className="hidden sm:table-cell">Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => (
            <TableRow key={alert.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getAlertTypeIcon(alert.alert_type)}
                  <span className="capitalize text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">{alert.alert_type.replace(/_/g, ' ')}</span>
                </div>
              </TableCell>
              <TableCell className="max-w-md truncate hidden sm:table-cell text-xs sm:text-sm">{alert.description}</TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="outline" className="capitalize text-xs">
                  {alert.entity_type}
                </Badge>
              </TableCell>
              <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
              <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{format(new Date(alert.created_at), 'MMM d, HH:mm')}</TableCell>
              <TableCell className="text-right">
                {alert.status === 'pending' || alert.status === 'investigating' ? (
                  <div className="flex justify-end gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedAlert(alert);
                        setResolveDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {alert.status === 'resolved' ? 'Resolved' : 'Dismissed'}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
          {alerts.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No fraud alerts found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Fraud Detection</h1>
            <p className="text-muted-foreground">Monitor and investigate fraud alerts</p>
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-64 w-full" />
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
          <h1 className="text-xl sm:text-2xl font-bold">Fraud Detection</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Monitor and investigate fraud alerts</p>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
          <Card className={pendingAlerts.length > 0 ? 'border-destructive' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${pendingAlerts.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                <div>
                  <div className="text-2xl font-bold">{pendingAlerts.length}</div>
                  <p className="text-xs text-muted-foreground">Pending Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{investigatingAlerts.length}</div>
                  <p className="text-xs text-muted-foreground">Investigating</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{resolvedAlerts.length}</div>
                  <p className="text-xs text-muted-foreground">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">
                    {alerts?.filter(a => a.severity === 'critical' || a.severity === 'high').length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">High Severity</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Types Info */}
        <Card>
          <CardHeader>
            <CardTitle>Fraud Detection Types</CardTitle>
            <CardDescription>Types of fraud detected by the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Vote Fraud</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Suspicious vote patterns, rapid voting, bulk vote purchases
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">Duplicate Detection</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Multiple accounts from same device, duplicate ticket usage
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-red-500" />
                  <span className="font-medium">Payment Fraud</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Refund abuse, blacklisted cards, suspicious transactions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Fraud Alerts</CardTitle>
            <CardDescription>Review and investigate detected fraud</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList>
                <TabsTrigger value="pending">
                  Pending ({pendingAlerts.length})
                </TabsTrigger>
                <TabsTrigger value="investigating">
                  Investigating ({investigatingAlerts.length})
                </TabsTrigger>
                <TabsTrigger value="resolved">
                  Resolved ({resolvedAlerts.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="mt-4">
                <AlertsTable alerts={pendingAlerts} />
              </TabsContent>
              <TabsContent value="investigating" className="mt-4">
                <AlertsTable alerts={investigatingAlerts} />
              </TabsContent>
              <TabsContent value="resolved" className="mt-4">
                <AlertsTable alerts={resolvedAlerts} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Resolve Dialog */}
        <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Fraud Alert</DialogTitle>
              <DialogDescription>
                Investigate and take action on this fraud alert
              </DialogDescription>
            </DialogHeader>
            {selectedAlert && (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Alert Type</span>
                    <div className="flex items-center gap-2">
                      {getAlertTypeIcon(selectedAlert.alert_type)}
                      <span className="capitalize">{selectedAlert.alert_type.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Severity</span>
                    {getSeverityBadge(selectedAlert.severity)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Entity</span>
                    <Badge variant="outline" className="capitalize">
                      {selectedAlert.entity_type}: {selectedAlert.entity_id.slice(0, 8)}...
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Detected</span>
                    <span>{format(new Date(selectedAlert.created_at), 'PPP HH:mm')}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Description</p>
                  <p className="text-sm text-muted-foreground">{selectedAlert.description}</p>
                </div>

                {selectedAlert.metadata && (
                  <div>
                    <p className="text-sm font-medium mb-2">Additional Data</p>
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">
                      {JSON.stringify(selectedAlert.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium mb-2">Resolution Notes</p>
                  <Textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Enter investigation findings and actions taken..."
                    rows={4}
                  />
                </div>
              </div>
            )}
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="secondary"
                onClick={() => {
                  setResolveAction('dismissed');
                  handleResolve();
                }}
                disabled={resolveAlert.isPending}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Dismiss
              </Button>
              <Button 
                className="bg-green-500 hover:bg-green-600"
                onClick={() => {
                  setResolveAction('resolved');
                  handleResolve();
                }}
                disabled={resolveAlert.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark Resolved
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminFraud;