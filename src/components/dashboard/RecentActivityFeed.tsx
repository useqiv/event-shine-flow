import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyVotes } from '@/hooks/useContests';
import { useMyTickets } from '@/hooks/useEvents';
import { useWalletTransactions } from '@/hooks/useWallet';
import { Activity, Vote, Ticket, Wallet, ArrowDownLeft, ArrowUpRight, Gift } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'vote' | 'ticket' | 'deposit' | 'withdrawal' | 'voucher' | 'referral';
  title: string;
  subtitle: string;
  amount: number;
  currency?: string;
  isCredit: boolean;
  timestamp: Date;
  link?: string;
}

export const RecentActivityFeed = () => {
  const { data: votes, isLoading: votesLoading } = useMyVotes();
  const { data: tickets, isLoading: ticketsLoading } = useMyTickets();
  const { data: transactions, isLoading: txLoading } = useWalletTransactions();

  const isLoading = votesLoading || ticketsLoading || txLoading;

  const activities = useMemo(() => {
    const items: ActivityItem[] = [];

    // Add votes
    votes?.forEach((vote: any) => {
      items.push({
        id: `vote-${vote.id}`,
        type: 'vote',
        title: `Voted for ${vote.contestant?.name || 'Contestant'}`,
        subtitle: vote.contest?.title || 'Contest',
        amount: Number(vote.amount_paid),
        currency: (vote.currency || vote.contest?.vote_currency || 'NGN').toUpperCase(),
        isCredit: false,
        timestamp: new Date(vote.created_at),
        link: `/contests/${vote.contest_id}`,
      });
    });

    // Add tickets
    tickets?.forEach((ticket: any) => {
      items.push({
        id: `ticket-${ticket.id}`,
        type: 'ticket',
        title: `Purchased ${ticket.quantity}x ${ticket.ticket_type?.name || 'ticket'}`,
        subtitle: ticket.event?.title || 'Event',
        amount: Number(ticket.amount_paid),
        currency: ticket.currency || ticket.event?.currency || 'NGN',
        isCredit: false,
        timestamp: new Date(ticket.created_at),
        link: `/events/${ticket.event_id}`,
      });
    });

    // Add wallet transactions (only completed deposits, vouchers, referrals)
    transactions?.forEach((tx: any) => {
      // Only show completed transactions
      if (tx.status !== 'completed') return;
      
      if (tx.type === 'deposit' || tx.type === 'voucher' || tx.type === 'referral') {
        items.push({
          id: `tx-${tx.id}`,
          type: tx.type,
          title: tx.type === 'deposit' 
            ? 'Wallet funded' 
            : tx.type === 'voucher' 
              ? 'Voucher redeemed' 
              : 'Referral bonus',
          subtitle: tx.description || 'Transaction',
          amount: Math.abs(tx.amount),
          currency: tx.currency || 'NGN',
          isCredit: true,
          timestamp: new Date(tx.created_at),
          link: '/wallet',
        });
      }
    });

    // Sort by timestamp (most recent first)
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
  }, [votes, tickets, transactions]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'vote':
        return <Vote className="h-4 w-4 text-primary" />;
      case 'ticket':
        return <Ticket className="h-4 w-4 text-accent" />;
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'voucher':
        return <Gift className="h-4 w-4 text-green-500" />;
      case 'referral':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getBadge = (type: string) => {
    switch (type) {
      case 'vote':
        return <Badge variant="secondary" className="text-xs">Vote</Badge>;
      case 'ticket':
        return <Badge variant="secondary" className="text-xs">Ticket</Badge>;
      case 'deposit':
        return <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">Deposit</Badge>;
      case 'voucher':
        return <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">Voucher</Badge>;
      case 'referral':
        return <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">Referral</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-2">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                to={activity.link || '#'}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  {getIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    {getBadge(activity.type)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{activity.subtitle}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-medium ${activity.isCredit ? 'text-green-500' : ''}`}>
                    {activity.isCredit ? '+' : '-'}
                    {activity.currency === 'NGN' || !activity.currency ? '₦' : activity.currency + ' '}
                    {activity.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start voting or buying tickets to see your activity here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
