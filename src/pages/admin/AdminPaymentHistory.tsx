import React, { useState, useMemo } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CalendarIcon, Download, Search, Filter, CreditCard, Wallet } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';

interface PaymentTransaction {
  id: string;
  type: 'vote' | 'ticket';
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  event_title?: string;
  contest_title?: string;
  quantity: number;
}

const AdminPaymentHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // Fetch votes
  const { data: votes, isLoading: votesLoading } = useQuery({
    queryKey: ['admin-votes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('votes')
        .select(`
          id,
          quantity,
          amount_paid,
          payment_method,
          created_at,
          contest:contests(id, title),
          contestant:contestants(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch tickets
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          quantity,
          amount_paid,
          payment_method,
          status,
          created_at,
          event:events(id, title),
          ticket_type:ticket_types(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch wallet transactions for crypto payments
  const { data: walletTxs, isLoading: walletLoading } = useQuery({
    queryKey: ['admin-wallet-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .in('type', ['vote_purchase', 'ticket_purchase', 'crypto_payment'])
        .order('created_at', { ascending: false });
      
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

    // Add votes
    votes?.forEach((vote: any) => {
      transactions.push({
        id: vote.id,
        type: 'vote',
        amount: vote.amount_paid,
        status: 'completed',
        payment_method: vote.payment_method,
        created_at: vote.created_at,
        user_name: null,
        user_email: null,
        contest_title: vote.contest?.title,
        quantity: vote.quantity,
      });
    });

    // Add tickets
    tickets?.forEach((ticket: any) => {
      transactions.push({
        id: ticket.id,
        type: 'ticket',
        amount: ticket.amount_paid,
        status: ticket.status,
        payment_method: ticket.payment_method,
        created_at: ticket.created_at,
        user_name: null,
        user_email: null,
        event_title: ticket.event?.title,
        quantity: ticket.quantity,
      });
    });

    return transactions.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [votes, tickets]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      // Search filter
      const searchMatch = !searchTerm || 
        tx.contest_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.event_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

      // Date filter
      let dateMatch = true;
      if (dateRange.from && dateRange.to) {
        const txDate = new Date(tx.created_at);
        dateMatch = isWithinInterval(txDate, { start: dateRange.from, end: dateRange.to });
      }

      return searchMatch && statusMatch && methodMatch && typeMatch && entityMatch && dateMatch;
    });
  }, [allTransactions, searchTerm, statusFilter, methodFilter, typeFilter, entityFilter, dateRange, votes, tickets]);

  // Calculate totals
  const totals = useMemo(() => {
    const completed = filteredTransactions.filter(t => t.status === 'completed' || t.status === 'active');
    return {
      total: filteredTransactions.reduce((sum, t) => sum + t.amount, 0),
      completed: completed.reduce((sum, t) => sum + t.amount, 0),
      count: filteredTransactions.length,
      votes: filteredTransactions.filter(t => t.type === 'vote').length,
      tickets: filteredTransactions.filter(t => t.type === 'ticket').length,
    };
  }, [filteredTransactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Entity', 'Quantity', 'Amount', 'Payment Method', 'Status', 'ID'];
    const rows = filteredTransactions.map(tx => [
      format(new Date(tx.created_at), 'yyyy-MM-dd HH:mm'),
      tx.type,
      tx.contest_title || tx.event_title || '-',
      tx.quantity,
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

  const isLoading = votesLoading || ticketsLoading || walletLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payment History</h1>
            <p className="text-muted-foreground">View and analyze all payment transactions</p>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Transactions</CardDescription>
              <CardTitle className="text-2xl">{totals.count}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(totals.completed)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Vote Purchases</CardDescription>
              <CardTitle className="text-2xl">{totals.votes}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Ticket Purchases</CardDescription>
              <CardTitle className="text-2xl">{totals.tickets}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
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

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from && dateRange.to ? (
                      `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
                    ) : (
                      "Date Range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              Showing {filteredTransactions.length} of {allTransactions.length} transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contest/Event</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.slice(0, 100).map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm">
                          {format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={tx.type === 'vote' ? 'default' : 'secondary'}>
                            {tx.type === 'vote' ? '🗳️ Vote' : '🎫 Ticket'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {tx.contest_title || tx.event_title || '-'}
                        </TableCell>
                        <TableCell>{tx.quantity}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(tx.amount)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {tx.payment_method === 'crypto' ? (
                              <Wallet className="h-4 w-4" />
                            ) : (
                              <CreditCard className="h-4 w-4" />
                            )}
                            <span className="capitalize text-sm">{tx.payment_method}</span>
                          </div>
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
