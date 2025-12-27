import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, User } from 'lucide-react';

interface Donor {
  id: string;
  amount: number;
  currency: string;
  is_anonymous: boolean;
  donor?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface DonorLeaderboardProps {
  donations: Donor[];
  currency: string;
}

const DonorLeaderboard: React.FC<DonorLeaderboardProps> = ({ donations, currency }) => {
  // Aggregate donations by donor (using index for anonymous to keep them separate)
  const donorTotals = donations.reduce((acc, donation, idx) => {
    const donorKey = donation.is_anonymous ? `anonymous-${idx}` : (donation.donor?.full_name || `unknown-${idx}`);
    
    if (!acc[donorKey]) {
      acc[donorKey] = {
        id: donorKey,
        name: donation.is_anonymous ? 'Anonymous' : (donation.donor?.full_name || 'Anonymous'),
        avatar_url: donation.is_anonymous ? null : donation.donor?.avatar_url,
        total: 0,
        isAnonymous: donation.is_anonymous,
      };
    }
    acc[donorKey].total += donation.amount;
    return acc;
  }, {} as Record<string, { id: string; name: string; avatar_url: string | null; total: number; isAnonymous: boolean }>);

  // Sort by total and get top 10
  const topDonors = Object.values(donorTotals)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{index + 1}</span>;
    }
  };

  if (topDonors.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Top Contributors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topDonors.map((donor, index) => (
            <div
              key={donor.id}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                index === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' :
                index === 1 ? 'bg-muted/80' :
                index === 2 ? 'bg-amber-500/5' :
                'bg-muted/50'
              }`}
            >
              <div className="flex-shrink-0">
                {getRankIcon(index)}
              </div>
              <Avatar className="h-8 w-8">
                {donor.isAnonymous ? (
                  <AvatarFallback>?</AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src={donor.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{donor.name}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">
                  {currency} {Number(donor.total).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DonorLeaderboard;
