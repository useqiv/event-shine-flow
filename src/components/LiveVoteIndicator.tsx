import { useEffect, useState } from 'react';
import { Vote, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoteEvent {
  contestantId: string;
  contestantName: string;
  newVoteCount: number;
  timestamp: number;
}

interface LiveVoteIndicatorProps {
  voteEvent: VoteEvent | null;
  onDismiss: () => void;
}

const LiveVoteIndicator = ({ voteEvent, onDismiss }: LiveVoteIndicatorProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (voteEvent) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [voteEvent, onDismiss]);

  if (!voteEvent) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300',
        'bg-primary text-primary-foreground',
        isVisible 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-4 opacity-0'
      )}
    >
      <div className="relative">
        <Vote className="h-5 w-5" />
        <Sparkles className="h-3 w-3 absolute -top-1 -right-1 animate-pulse" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium">New vote received!</span>
        <span className="text-xs opacity-90">
          {voteEvent.contestantName} now has {voteEvent.newVoteCount.toLocaleString()} votes
        </span>
      </div>
    </div>
  );
};

interface VotePulseProps {
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
}

export const VotePulse = ({ isActive, children, className }: VotePulseProps) => {
  return (
    <div className={cn('relative', className)}>
      {isActive && (
        <>
          <div className="absolute inset-0 rounded-lg bg-primary/20 animate-ping" />
          <div className="absolute -top-2 -right-2 z-10">
            <span className="flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-primary items-center justify-center">
                <Sparkles className="h-2.5 w-2.5 text-primary-foreground" />
              </span>
            </span>
          </div>
        </>
      )}
      <div className={cn(
        'relative transition-all duration-300',
        isActive && 'scale-[1.02] ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg'
      )}>
        {children}
      </div>
    </div>
  );
};

interface LiveVoteCounterProps {
  count: number;
  isUpdating: boolean;
}

export const LiveVoteCounter = ({ count, isUpdating }: LiveVoteCounterProps) => {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 transition-all duration-300 font-semibold',
      isUpdating && 'text-primary scale-110'
    )}>
      {count.toLocaleString()}
      {isUpdating && (
        <span className="inline-flex items-center">
          <span className="animate-bounce text-xs">+</span>
        </span>
      )}
    </span>
  );
};

export default LiveVoteIndicator;
