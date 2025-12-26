import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isAfter } from 'date-fns';

interface QuickRevoteProps {
  vote: any;
}

export const QuickRevote: React.FC<QuickRevoteProps> = ({ vote }) => {
  const navigate = useNavigate();

  // Check if contest is still active
  const isContestActive = vote.contest?.end_date && 
    isAfter(new Date(vote.contest.end_date), new Date()) &&
    vote.contest?.is_active;

  if (!isContestActive) {
    return null;
  }

  const handleRevote = () => {
    // Navigate to contest page with contestant pre-selected
    navigate(`/contests/${vote.contest_id}?vote=${vote.contestant_id}`);
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleRevote}
      className="gap-1"
    >
      <RefreshCw className="h-4 w-4" />
      Vote Again
    </Button>
  );
};
