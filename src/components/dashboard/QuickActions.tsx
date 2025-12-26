import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Vote, Ticket, Wallet, Trophy, Calendar, Users } from 'lucide-react';

export const QuickActions = () => {
  const actions = [
    {
      label: 'Vote Now',
      description: 'Support your favorites',
      icon: Vote,
      href: '/contests',
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Buy Tickets',
      description: 'Get event access',
      icon: Ticket,
      href: '/events',
      color: 'bg-accent/10 text-accent',
    },
    {
      label: 'Fund Wallet',
      description: 'Add balance',
      icon: Wallet,
      href: '/wallet',
      color: 'bg-chart-3/10 text-chart-3',
    },
    {
      label: 'Leaderboard',
      description: 'Referral rankings',
      icon: Users,
      href: '/referral-leaderboard',
      color: 'bg-chart-4/10 text-chart-4',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action) => (
            <Link key={action.label} to={action.href}>
              <Button
                variant="outline"
                className="w-full h-auto flex flex-col items-center gap-2 py-4 hover:bg-secondary/50"
              >
                <div className={`h-10 w-10 rounded-lg ${action.color} flex items-center justify-center`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
