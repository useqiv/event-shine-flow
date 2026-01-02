import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/components/ui/currency-selector';
import { format } from 'date-fns';
import { Download, Filter, CreditCard, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { exportToCsv, formatDateForExport, formatCurrencyForExport } from '@/lib/exportCsv';

type EntityType = 'contest' | 'event' | 'campaign';
type StatusFilter = 'all' | 'completed' | 'pending' | 'failed' | 'cancelled';

interface EntityTransactionHistoryProps {
  entityType: EntityType;
  entityId: string;
  currency?: string;
}

interface Transaction {
  id: string;
  user_name: string | null;
  user_email: string | null;
  amount: number;
  quantity: number;
  payment_method: string;
  status: string;
  created_at: string;
  item_name?: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  completed: { label: 'Completed', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  active: { label: 'Completed', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  success: { label: 'Completed', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  pending: { label: 'Pending', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  processing: { label: 'Processing', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  failed: { label: 'Failed', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  declined: { label: 'Declined', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  cancelled: { label: 'Cancelled', variant: 'outline', icon: <AlertCircle className="h-3 w-3" /> },
  refunded: { label: 'Refunded', variant: 'outline', icon: <AlertCircle className="h-3 w-3" /> },
};

const EntityTransactionHistory: React.FC<EntityTransactionHistoryProps> = ({
  entityType,
  entityId,
  currency = 'NGN',
}) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['entity-transactions', entityType, entityId, statusFilter, page],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      if (entityType === 'contest') {
        // Votes don't have status, so we treat all as completed
        const { data, error } = await supabase
          .from('votes')
          .select(`
            id,
            quantity,
            amount_paid,
            payment_method,
            created_at,
            contestant_id,
            user_id
          `)
          .eq('contest_id', entityId)
          .order('created_at', { ascending: false })
          .range(from, to);
        
        if (error) throw error;
        
        // Fetch related data separately
        const contestantIds = [...new Set(data?.map(v => v.contestant_id).filter(Boolean))];
        const userIds = [...new Set(data?.map(v => v.user_id).filter(Boolean))];
        
        const [contestantsRes, usersRes] = await Promise.all([
          contestantIds.length > 0 
            ? supabase.from('contestants').select('id, name').in('id', contestantIds)
            : { data: [] },
          userIds.length > 0 
            ? supabase.from('profiles').select('id, full_name, email').in('id', userIds)
            : { data: [] },
        ]);
        
        const contestantsMap = new Map((contestantsRes.data || []).map(c => [c.id, c]));
        const usersMap = new Map((usersRes.data || []).map(u => [u.id, u]));
        
        const enrichedData = data?.map(v => ({
          ...v,
          contestant: contestantsMap.get(v.contestant_id),
          user: usersMap.get(v.user_id),
        }));
        
        return { transactions: enrichedData || [] };
      } else if (entityType === 'event') {
        let query = supabase
          .from('tickets')
          .select(`
            id,
            quantity,
            amount_paid,
            payment_method,
            status,
            created_at,
            guest_name,
            guest_email,
            ticket_type_id,
            user_id
          `)
          .eq('event_id', entityId)
          .order('created_at', { ascending: false });
        
        if (statusFilter !== 'all') {
          const statusMap: Record<string, string[]> = {
            completed: ['active', 'completed'],
            pending: ['pending', 'processing'],
            failed: ['failed', 'declined'],
            cancelled: ['cancelled', 'refunded'],
          };
          query = query.in('status', statusMap[statusFilter] || [statusFilter]);
        }
        
        const { data, error } = await query.range(from, to);
        if (error) throw error;
        
        // Fetch related data separately
        const ticketTypeIds = [...new Set(data?.map(t => t.ticket_type_id).filter(Boolean))];
        const userIds = [...new Set(data?.map(t => t.user_id).filter(Boolean))];
        
        const [ticketTypesRes, usersRes] = await Promise.all([
          ticketTypeIds.length > 0 
            ? supabase.from('ticket_types').select('id, name').in('id', ticketTypeIds)
            : { data: [] },
          userIds.length > 0 
            ? supabase.from('profiles').select('id, full_name, email').in('id', userIds)
            : { data: [] },
        ]);
        
        const ticketTypesMap = new Map((ticketTypesRes.data || []).map(tt => [tt.id, tt]));
        const usersMap = new Map((usersRes.data || []).map(u => [u.id, u]));
        
        const enrichedData = data?.map(t => ({
          ...t,
          ticket_type: ticketTypesMap.get(t.ticket_type_id),
          user: usersMap.get(t.user_id),
        }));
        
        return { transactions: enrichedData || [] };
      } else {
        // Campaign donations
        let query = supabase
          .from('donations')
          .select(`
            id,
            amount,
            currency,
            payment_method,
            status,
            is_anonymous,
            created_at,
            donor_id
          `)
          .eq('campaign_id', entityId)
          .order('created_at', { ascending: false });
        
        if (statusFilter !== 'all') {
          const statusMap: Record<string, string[]> = {
            completed: ['completed', 'success'],
            pending: ['pending', 'processing'],
            failed: ['failed', 'declined'],
            cancelled: ['cancelled', 'refunded'],
          };
          query = query.in('status', statusMap[statusFilter] || [statusFilter]);
        }
        
        const { data, error } = await query.range(from, to);
        if (error) throw error;
        
        // Fetch donor data separately
        const donorIds = [...new Set(data?.map(d => d.donor_id).filter(Boolean))];
        
        const donorsRes = donorIds.length > 0 
          ? await supabase.from('profiles').select('id, full_name, email').in('id', donorIds)
          : { data: [] };
        
        const donorsMap = new Map((donorsRes.data || []).map(d => [d.id, d]));
        
        const enrichedData = data?.map(d => ({
          ...d,
          donor: donorsMap.get(d.donor_id),
        }));
        
        return { transactions: enrichedData || [] };
      }
    },
    enabled: !!entityId,
  });

  const transactions: Transaction[] = React.useMemo(() => {
    if (!data?.transactions) return [];
    
    return data.transactions.map((t: any) => {
      if (entityType === 'contest') {
        return {
          id: t.id,
          user_name: t.user?.full_name || 'Anonymous',
          user_email: t.user?.email || '',
          amount: t.amount_paid || 0,
          quantity: t.quantity || 1,
          payment_method: t.payment_method || 'unknown',
          status: 'completed', // Votes are always completed
          created_at: t.created_at,
          item_name: t.contestant?.name || 'Unknown',
        };
      } else if (entityType === 'event') {
        return {
          id: t.id,
          user_name: t.guest_name || t.user?.full_name || 'Guest',
          user_email: t.guest_email || t.user?.email || '',
          amount: t.amount_paid || 0,
          quantity: t.quantity || 1,
          payment_method: t.payment_method || 'unknown',
          status: t.status || 'active',
          created_at: t.created_at,
          item_name: t.ticket_type?.name || 'Ticket',
        };
      } else {
        return {
          id: t.id,
          user_name: t.is_anonymous ? 'Anonymous' : (t.donor?.full_name || 'Anonymous'),
          user_email: t.is_anonymous ? '' : (t.donor?.email || ''),
          amount: t.amount || 0,
          quantity: 1,
          payment_method: t.payment_method || 'unknown',
          status: t.status || 'completed',
          created_at: t.created_at,
          item_name: 'Donation',
        };
      }
    });
  }, [data, entityType]);

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status.toLowerCase()] || STATUS_CONFIG.pending;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const handleExport = () => {
    if (!transactions.length) return;
    
    const exportData = transactions.map(t => ({
      Date: formatDateForExport(t.created_at),
      Name: t.user_name,
      Email: t.user_email,
      Item: t.item_name,
      Quantity: t.quantity,
      Amount: formatCurrencyForExport(t.amount),
      'Payment Method': t.payment_method,
      Status: STATUS_CONFIG[t.status.toLowerCase()]?.label || t.status,
    }));
    
    exportToCsv(exportData, `${entityType}-transactions-${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const statusCounts = React.useMemo(() => {
    const counts = { all: 0, completed: 0, pending: 0, failed: 0, cancelled: 0 };
    transactions.forEach(t => {
      counts.all++;
      const status = t.status.toLowerCase();
      if (['completed', 'active', 'success'].includes(status)) counts.completed++;
      else if (['pending', 'processing'].includes(status)) counts.pending++;
      else if (['failed', 'declined'].includes(status)) counts.failed++;
      else if (['cancelled', 'refunded'].includes(status)) counts.cancelled++;
    });
    return counts;
  }, [transactions]);

  const entityLabel = entityType === 'contest' ? 'Votes' : entityType === 'event' ? 'Tickets' : 'Donations';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Transaction History
            </CardTitle>
            <CardDescription>
              All {entityLabel.toLowerCase()} transactions for this {entityType}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {entityType !== 'contest' && (
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!transactions.length}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Status Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{statusCounts.all}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
          <div className="bg-primary/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-primary">{statusCounts.completed}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{statusCounts.pending}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          <div className="bg-destructive/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-destructive">{statusCounts.failed + statusCounts.cancelled}</p>
            <p className="text-sm text-muted-foreground">Failed/Cancelled</p>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transactions found</p>
            <p className="text-sm">Transactions will appear here once {entityLabel.toLowerCase()} are made</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>{entityType === 'contest' ? 'Contestant' : entityType === 'event' ? 'Ticket Type' : 'Type'}</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(t.created_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{t.user_name}</p>
                          {t.user_email && (
                            <p className="text-sm text-muted-foreground">{t.user_email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{t.item_name}</TableCell>
                      <TableCell>{t.quantity}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(t.amount, currency)}
                      </TableCell>
                      <TableCell className="capitalize">{t.payment_method}</TableCell>
                      <TableCell>{getStatusBadge(t.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, transactions.length + ((page - 1) * pageSize))} transactions
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={transactions.length < pageSize}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EntityTransactionHistory;
