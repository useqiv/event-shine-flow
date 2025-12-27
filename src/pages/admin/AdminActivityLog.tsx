import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminActivityLogs } from '@/hooks/useAdminActivityLog';
import { Search, History, RefreshCw, UserX, UserCheck, CheckCircle, XCircle, Shield, Settings, Edit, Trash2, Eye, Download, FileText, FileDown } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToCsv, formatDateForExport } from '@/lib/exportCsv';
import { exportToPdf } from '@/lib/exportPdf';
import { toast } from 'sonner';

const AdminActivityLog: React.FC = () => {
  const { data: logs, isLoading, refetch, isFetching } = useAdminActivityLogs(200);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'suspend', label: 'User Suspensions' },
    { value: 'activate', label: 'User Activations' },
    { value: 'approve', label: 'Approvals' },
    { value: 'reject', label: 'Rejections' },
    { value: 'bulk', label: 'Bulk Actions' },
    { value: 'update', label: 'Updates' },
  ];

  const getActionIcon = (actionType: string) => {
    if (actionType.includes('suspend')) return <UserX className="h-4 w-4 text-destructive" />;
    if (actionType.includes('activate')) return <UserCheck className="h-4 w-4 text-green-500" />;
    if (actionType.includes('approve')) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (actionType.includes('reject')) return <XCircle className="h-4 w-4 text-destructive" />;
    if (actionType.includes('setting')) return <Settings className="h-4 w-4 text-muted-foreground" />;
    if (actionType.includes('update') || actionType.includes('edit')) return <Edit className="h-4 w-4 text-blue-500" />;
    if (actionType.includes('delete')) return <Trash2 className="h-4 w-4 text-destructive" />;
    if (actionType.includes('view')) return <Eye className="h-4 w-4 text-muted-foreground" />;
    return <Shield className="h-4 w-4 text-primary" />;
  };

  const getActionBadge = (actionType: string) => {
    if (actionType.includes('suspend') || actionType.includes('reject') || actionType.includes('delete')) {
      return <Badge variant="destructive">{actionType.replace(/_/g, ' ')}</Badge>;
    }
    if (actionType.includes('approve') || actionType.includes('activate')) {
      return <Badge className="bg-green-500">{actionType.replace(/_/g, ' ')}</Badge>;
    }
    if (actionType.includes('bulk')) {
      return <Badge variant="secondary">{actionType.replace(/_/g, ' ')}</Badge>;
    }
    return <Badge variant="outline">{actionType.replace(/_/g, ' ')}</Badge>;
  };

  const filteredLogs = logs?.filter(log => {
    const matchesSearch = 
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.admin?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.admin?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (actionFilter === 'all') return matchesSearch;
    return matchesSearch && log.action_type.toLowerCase().includes(actionFilter);
  }) || [];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Activity Log</h1>
            <p className="text-muted-foreground">Track all admin actions</p>
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

  const handleExportCsv = () => {
    if (!filteredLogs || filteredLogs.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = filteredLogs.map(log => ({
      admin_name: log.admin?.full_name || 'Unknown',
      admin_email: log.admin?.email || '',
      action_type: log.action_type,
      description: log.description,
      entity_type: log.entity_type || '',
      entity_id: log.entity_id || '',
      timestamp: formatDateForExport(log.created_at),
      ip_address: log.ip_address || '',
    }));

    exportToCsv(exportData, `admin-activity-log-${format(new Date(), 'yyyy-MM-dd')}`, [
      { key: 'admin_name', label: 'Admin Name' },
      { key: 'admin_email', label: 'Admin Email' },
      { key: 'action_type', label: 'Action Type' },
      { key: 'description', label: 'Description' },
      { key: 'entity_type', label: 'Entity Type' },
      { key: 'entity_id', label: 'Entity ID' },
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'ip_address', label: 'IP Address' },
    ]);

    toast.success('Activity log exported as CSV');
  };

  const handleExportPdf = () => {
    if (!filteredLogs || filteredLogs.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = filteredLogs.map(log => ({
      admin_name: log.admin?.full_name || 'Unknown',
      action_type: log.action_type.replace(/_/g, ' '),
      description: log.description.substring(0, 60) + (log.description.length > 60 ? '...' : ''),
      entity_type: log.entity_type || '-',
      timestamp: format(new Date(log.created_at), 'MMM d, yyyy HH:mm'),
    }));

    exportToPdf(exportData, [
      { key: 'admin_name', label: 'Admin', width: '15%' },
      { key: 'action_type', label: 'Action', width: '15%' },
      { key: 'description', label: 'Description', width: '35%' },
      { key: 'entity_type', label: 'Entity', width: '15%' },
      { key: 'timestamp', label: 'Time', width: '20%' },
    ], {
      title: 'Admin Activity Audit Log',
      subtitle: `Generated on ${format(new Date(), 'MMMM d, yyyy')} • ${filteredLogs.length} records`,
      filename: `admin-activity-log-${format(new Date(), 'yyyy-MM-dd')}`,
      orientation: 'landscape',
    });

    toast.success('Activity log exported as PDF');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Activity Log</h1>
            <p className="text-muted-foreground">Track all admin actions and changes</p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCsv}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPdf}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => refetch()} variant="outline" disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{logs?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Total Actions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-destructive" />
                <div>
                  <div className="text-2xl font-bold">
                    {logs?.filter(l => l.action_type.includes('suspend')).length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Suspensions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {logs?.filter(l => l.action_type.includes('approve')).length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Approvals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold">
                    {logs?.filter(l => l.action_type.includes('bulk')).length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Bulk Actions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Activities</CardTitle>
            <CardDescription>Complete history of admin actions</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={log.admin?.avatar_url || ''} />
                            <AvatarFallback>
                              {log.admin?.full_name?.charAt(0) || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{log.admin?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{log.admin?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action_type)}
                          {getActionBadge(log.action_type)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm truncate">{log.description}</p>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {JSON.stringify(log.metadata).slice(0, 50)}...
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.entity_type && (
                          <Badge variant="outline" className="capitalize">
                            {log.entity_type}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{format(new Date(log.created_at), 'MMM d, yyyy')}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No activity logs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminActivityLog;
