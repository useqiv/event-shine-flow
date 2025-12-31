import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoteSurgeNotification {
  id: string;
  contestantName: string;
  votes: number;
  timestamp: number;
}

interface VoteSurgeOverlayProps {
  surges: VoteSurgeNotification[];
  maxVisible?: number;
}

export const VoteSurgeOverlay: React.FC<VoteSurgeOverlayProps> = ({
  surges,
  maxVisible = 3,
}) => {
  const [visibleSurges, setVisibleSurges] = useState<VoteSurgeNotification[]>([]);

  useEffect(() => {
    // Add new surges and limit to maxVisible
    setVisibleSurges(prev => {
      const newSurges = surges.filter(
        s => !prev.some(ps => ps.id === s.id)
      );
      return [...newSurges, ...prev].slice(0, maxVisible);
    });

    // Remove surges after 5 seconds
    const timer = setTimeout(() => {
      setVisibleSurges(prev => prev.slice(0, -1));
    }, 5000);

    return () => clearTimeout(timer);
  }, [surges, maxVisible]);

  if (visibleSurges.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
      {visibleSurges.map((surge, index) => (
        <div
          key={surge.id}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right duration-500",
            "bg-gradient-to-r from-primary/90 to-primary text-primary-foreground",
            "pointer-events-auto"
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white/20">
            {surge.votes >= 10 ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <Zap className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{surge.contestantName}</p>
            <p className="text-xs opacity-90">
              {surge.votes >= 10 ? 'Vote Surge!' : 'Just voted!'}
            </p>
          </div>
          <Badge 
            variant="secondary" 
            className="bg-white/20 text-white border-0 text-lg font-bold"
          >
            +{surge.votes}
          </Badge>
        </div>
      ))}
    </div>
  );
};

export default VoteSurgeOverlay;
