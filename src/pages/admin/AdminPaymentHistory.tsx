import React, { useState, useMemo } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimePayments } from '@/hooks/useRealtimePayments';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';
import { formatCurrency } from '@/components/ui/currency-selector';
import CurrencyDisplay from '@/components/ui/currency-display';
import { Download, Search, Filter, CreditCard, Wallet } from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';

interface PaymentTransaction {
  id: string;
  type: 'vote' | 'ticket' | 'donation' | 'form';
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  event_title?: string;
  contest_title?: string;
  campaign_title?: string;
  form_title?: string;
  quantity: number;
  payment_reference_id?: string | null;
}

const AdminPaymentHistory = () => {
  // Platform default currency from settings
  const platformCurrency = usePlatformCurrency();
  
  // Enable real-time payment updates
  useRealtimePayments();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [daysFilter, setDaysFilter] = useState<string>('30');

  // Fetch votes - currency comes from contest.vote_currency
  const { data: votes, isLoading: votesLoading } = useQuery({
    queryKey: ['admin-votes'],
    queryFn: async () => {
      // Use votes_public view for secure access (masks guest info for non-owners)
      const { data, error } = await supabase
        .from('votes_public')
        .select(`
          id,
          quantity,
          amount_paid,
          payment_method,
          created_at,
          user_id,
          guest_email,
          guest_name,
          contest_id,
          payment_reference_id
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch contest info separately since view doesn't support joins
      const contestIds = [...new Set(data?.map(v => v.contest_id).filter(Boolean))];
      const { data: contests } = await supabase
        .from('contests')
        .select('id, title, vote_currency')
        .in('id', contestIds);
      
      const contestsMap = new Map(contests?.map(c => [c.id, c]) || []);
      
      return data?.map(v => ({
        ...v,
        contest: contestsMap.get(v.contest_id),
      }));
    },
  });

  // Fetch tickets - currency comes from ticket_type.currency
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      // Use tickets_public view for secure access (masks guest info for non-owners)
      const { data, error } = await supabase
        .from('tickets_public')
        .select(`
          id,
          quantity,
          amount_paid,
          payment_method,
          status,
          created_at,
          user_id,
          guest_name,
          guest_email,
          event_id,
          ticket_type_id,
          payment_reference_id
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch event and ticket type info separately
      const eventIds = [...new Set(data?.map(t => t.event_id).filter(Boolean))];
      const ticketTypeIds = [...new Set(data?.map(t => t.ticket_type_id).filter(Boolean))];
      
      const [eventsRes, ticketTypesRes] = await Promise.all([
        supabase.from('events').select('id, title').in('id', eventIds),
        supabase.from('ticket_types').select('id, name, currency').in('id', ticketTypeIds),
      ]);
      
      const eventsMap = new Map(eventsRes.data?.map(e => [e.id, e]) || []);
      const ticketTypesMap = new Map(ticketTypesRes.data?.map(t => [t.id, t]) || []);
      
      return data?.map(t => ({
        ...t,
        holder_name: t.guest_name,
        holder_email: t.guest_email,
        event: eventsMap.get(t.event_id),
        ticket_type: ticketTypesMap.get(t.ticket_type_id),
      }));
    },
  });

  // Fetch donations
  const { data: donations, isLoading: donationsLoading } = useQuery({
    queryKey: ['admin-donations'],
    queryFn: async () => {
      // Use donations_public view for secure access (masks guest info for non-owners/admins)
      const { data, error } = await supabase
        .from('donations_public')
        .select(`
          id,
          amount,
          currency,
          payment_method,
          status,
          created_at,
          donor_id,
          guest_email,
          guest_name,
          is_anonymous,
          campaign_id
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch campaign info separately
      const campaignIds = [...new Set(data?.map(d => d.campaign_id).filter(Boolean))];
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, title, currency')
        .in('id', campaignIds);
      
      const campaignsMap = new Map(campaigns?.map(c => [c.id, c]) || []);
      
      return data?.map(d => ({
        ...d,
        campaign: campaignsMap.get(d.campaign_id),
      }));
    },
  });

  // Fetch form responses with payments
  const { data: formResponses, isLoading: formsLoading } = useQuery({
    queryKey: ['admin-form-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_responses')
        .select(`
          id,
          payment_amount,
          payment_status,
          payment_reference,
          submitted_at,
          form:forms(id, title, payment_currency)
        `)
        .not('payment_amount', 'is', null)
        .gt('payment_amount', 0)
        .order('submitted_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch contests and events for filter
  const { data: contests } = useQuery({
    queryKey: ['admin-contests-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contests').select('id, title');
      if (error) throw error;
      return data;
    },
  });

  const { data: events } = useQuery({
    queryKey: ['admin-events-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('id, title');
      if (error) throw error;
      return data;
    },
  });

  // Combine and format transactions
  const allTransactions = useMemo(() => {
    const transactions: PaymentTransaction[] = [];

    // Add votes - get currency from contest.vote_currency
    votes?.forEach((vote: any) => {
      // Use guest info if user_id is null (guest vote)
      const isGuest = !vote.user_id;
      transactions.push({
        id: vote.id,
        type: 'vote',
        amount: vote.amount_paid,
        currency: vote.contest?.vote_currency || 'NGN',
        status: 'completed',
        payment_method: vote.payment_method,
        created_at: vote.created_at,
        user_name: isGuest ? (vote.guest_name || 'Guest') : null,
        user_email: isGuest ? vote.guest_email : null,
        contest_title: vote.contest?.title,
        quantity: vote.quantity,
        payment_reference_id: vote.payment_reference_id,
      });
    });

    // Add tickets - get currency from ticket_type.currency
    tickets?.forEach((ticket: any) => {
      // Use holder info for guest tickets
      const isGuest = !ticket.user_id;
      transactions.push({
        id: ticket.id,
        type: 'ticket',
        amount: ticket.amount_paid,
        currency: ticket.ticket_type?.currency || 'NGN',
        status: ticket.status,
        payment_method: ticket.payment_method,
        created_at: ticket.created_at,
        user_name: isGuest ? (ticket.holder_name || 'Guest') : null,
        user_email: isGuest ? ticket.holder_email : null,
        event_title: ticket.event?.title,
        quantity: ticket.quantity,
        payment_reference_id: ticket.payment_reference_id,
      });
    });

    // Add donations
    donations?.forEach((donation: any) => {
      // Use guest info for guest donations
      const isGuest = !donation.donor_id;
      const isAnonymous = donation.is_anonymous;
      transactions.push({
        id: donation.id,
        type: 'donation',
        amount: donation.amount,
        currency: donation.currency || donation.campaign?.currency || 'NGN',
        status: donation.status,
        payment_method: donation.payment_method,
        created_at: donation.created_at,
        user_name: isAnonymous ? 'Anonymous' : (isGuest ? (donation.guest_name || 'Guest') : null),
        user_email: isAnonymous ? null : (isGuest ? donation.guest_email : null),
        campaign_title: donation.campaign?.title,
        quantity: 1,
      });
    });

    // Add form payments
    formResponses?.forEach((response: any) => {
      if (response.payment_amount && response.payment_amount > 0) {
        transactions.push({
          id: response.id,
          type: 'form',
          amount: response.payment_amount,
          currency: response.form?.payment_currency || 'NGN',
          status: response.payment_status || 'pending',
          payment_method: 'flutterwave',
          created_at: response.submitted_at,
          user_name: null,
          user_email: null,
          form_title: response.form?.title,
          quantity: 1,
        });
      }
    });

    return transactions.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [votes, tickets, donations, formResponses]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      // Search filter
      const searchMatch = !searchTerm || 
        tx.contest_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.event_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.campaign_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.form_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.payment_reference_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.id.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const statusMatch = statusFilter === 'all' || tx.status === statusFilter;

      // Payment method filter
      const methodMatch = methodFilter === 'all' || tx.payment_method === methodFilter;

      // Type filter
      const typeMatch = typeFilter === 'all' || tx.type === typeFilter;

      // Entity filter (contest/event)
      let entityMatch = true;
      if (entityFilter !== 'all') {
        if (entityFilter.startsWith('contest_')) {
          const contestId = entityFilter.replace('contest_', '');
          entityMatch = tx.type === 'vote' && 
            votes?.some((v: any) => v.id === tx.id && v.contest?.id === contestId);
        } else if (entityFilter.startsWith('event_')) {
          const eventId = entityFilter.replace('event_', '');
          entityMatch = tx.type === 'ticket' && 
            tickets?.some((t: any) => t.id === tx.id && t.event?.id === eventId);
        }
      }

      // Date filter based on days
      let dateMatch = true;
      if (daysFilter !== 'all') {
        const daysAgo = subDays(new Date(), parseInt(daysFilter));
        const txDate = new Date(tx.created_at);
        dateMatch = isAfter(txDate, daysAgo);
      }

      return searchMatch && statusMatch && methodMatch && typeMatch && entityMatch && dateMatch;
    });
  }, [allTransactions, searchTerm, statusFilter, methodFilter, typeFilter, entityFilter, daysFilter, votes, tickets]);

  // Calculate totals per currency
  const currencyTotals = useMemo(() => {
    // Include all successful transaction statuses for revenue calculation
    const successStatuses = ['completed', 'active', 'confirmed', 'used'];
    const completed = filteredTransactions.filter(t => successStatuses.includes(t.status));
    const byCurrency: Record<string, number> = {};
    
    completed.forEach(t => {
      const currency = t.currency || 'NGN';
      byCurrency[currency] = (byCurrency[currency] || 0) + t.amount;
    });
    
    return byCurrency;
  }, [filteredTransactions]);

  // Calculate count totals
  const totals = useMemo(() => {
    return {
      count: filteredTransactions.length,
      votes: filteredTransactions.filter(t => t.type === 'vote').length,
      tickets: filteredTransactions.filter(t => t.type === 'ticket').length,
    };
  }, [filteredTransactions]);

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Entity', 'Quantity', 'Currency', 'Amount', 'Payment Method', 'Status', 'ID'];
    const rows = filteredTransactions.map(tx => [
      format(new Date(tx.created_at), 'yyyy-MM-dd HH:mm'),
      tx.type,
      tx.contest_title || tx.event_title || tx.campaign_title || tx.form_title || '-',
      tx.quantity,
      tx.currency,
      tx.amount,
      tx.payment_method,
      tx.status,
      tx.id,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = votesLoading || ticketsLoading || donationsLoading || formsLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Payment History</h1>
            <p className="text-muted-foreground text-sm sm:text-base">View and analyze all payment transactions</p>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-3">
          <Card>
            <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
              <CardDescription className="text-xs sm:text-sm">Total Transactions</CardDescription>
              <CardTitle className="text-lg sm:text-2xl">{totals.count}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
              <CardDescription className="text-xs sm:text-sm">Vote Purchases</CardDescription>
              <CardTitle className="text-lg sm:text-2xl">{totals.votes}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
              <CardDescription className="text-xs sm:text-sm">Ticket Purchases</CardDescription>
              <CardTitle className="text-lg sm:text-2xl">{totals.tickets}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Revenue by Currency Cards */}
        {Object.keys(currencyTotals).length > 0 && (
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            {Object.entries(currencyTotals)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([currency, amount]) => (
                <Card key={currency} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
                    <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                      <Badge variant="outline" className="text-xs">{currency}</Badge>
                      Revenue
                    </CardDescription>
                    <CardTitle className="text-base sm:text-2xl">
                      <CurrencyDisplay amount={amount} currency={currency} />
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="relative col-span-2 sm:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="vote">Votes</SelectItem>
                  <SelectItem value="ticket">Tickets</SelectItem>
                  <SelectItem value="donation">Donations</SelectItem>
                  <SelectItem value="form">Form Payments</SelectItem>
                </SelectContent>
              </Select>

              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Contest/Event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contests/Events</SelectItem>
                  {contests?.map((c) => (
                    <SelectItem key={c.id} value={`contest_${c.id}`}>
                      🏆 {c.title}
                    </SelectItem>
                  ))}
                  {events?.map((e) => (
                    <SelectItem key={e.id} value={`event_${e.id}`}>
                      🎫 {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="flutterwave">Flutterwave</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={daysFilter} onValueChange={setDaysFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="120">Last 120 days</SelectItem>
                  <SelectItem value="240">Last 240 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Transactions</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Showing {filteredTransactions.length} of {allTransactions.length} transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Date</TableHead>
                    <TableHead className="text-xs sm:text-sm">Type</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Contest/Event</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden md:table-cell">Qty</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden md:table-cell">Currency</TableHead>
                    <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Method</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden xl:table-cell">Reference</TableHead>
                    <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.slice(0, 100).map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                          {format(new Date(tx.created_at), 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={tx.type === 'vote' ? 'default' : tx.type === 'ticket' ? 'secondary' : tx.type === 'donation' ? 'outline' : 'default'} className="text-xs">
                            {tx.type === 'vote' ? '🗳️' : tx.type === 'ticket' ? '🎫' : tx.type === 'donation' ? '💝' : '📋'}
                            <span className="hidden sm:inline ml-1">{tx.type}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate hidden sm:table-cell text-xs sm:text-sm">
                          {tx.contest_title || tx.event_title || tx.campaign_title || tx.form_title || '-'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs sm:text-sm">{tx.quantity}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-xs">{tx.currency}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          <CurrencyDisplay amount={tx.amount} currency={tx.currency} />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1">
                            {tx.payment_method === 'crypto' ? (
                              <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
                            ) : (
                              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                            <span className="capitalize text-xs sm:text-sm">{tx.payment_method}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell max-w-[140px]">
                          <span className="font-mono text-xs truncate block" title={tx.payment_reference_id || undefined}>
                            {tx.payment_reference_id || '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              tx.status === 'completed' || tx.status === 'active'
                                ? 'default'
                                : tx.status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                            }
                            className="text-xs"
                          >
                            {tx.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPaymentHistory;
