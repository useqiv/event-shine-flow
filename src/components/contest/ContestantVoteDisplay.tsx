import React from 'react';
import { Vote } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  type VoteDisplayMode,
  getVoteProgressPercent,
} from '@/lib/voteDisplay';

export interface ContestantVoteDisplayProps {
  mode: VoteDisplayMode;
  voteCount: number;
  /** Leader vote count; used for progress bar width. Defaults to voteCount. */
  maxVotes?: number;
  isPublicVotes?: boolean;
  primaryColor?: string;
  className?: string;
  showIcon?: boolean;
}

export const ContestantVoteDisplay: React.FC<ContestantVoteDisplayProps> = ({
  mode,
  voteCount,
  maxVotes,
  isPublicVotes = true,
  primaryColor,
  className,
  showIcon = true,
}) => {
  if (!isPublicVotes) {
    return (
      <span className={cn('text-sm text-muted-foreground', className)}>
        Votes hidden
      </span>
    );
  }

  if (mode === 'progress_bar') {
    const percent = getVoteProgressPercent(voteCount, maxVotes ?? voteCount);
    return (
      <div className={cn('w-full min-w-[80px] max-w-[140px]', className)}>
        <Progress
          value={percent}
          className="h-2"
          style={
            primaryColor
              ? ({ ['--progress-background' as string]: `${primaryColor}30` } as React.CSSProperties)
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <span className={cn('flex items-center gap-1 text-sm text-muted-foreground', className)}>
      {showIcon && <Vote className="h-4 w-4 shrink-0" />}
      <span>{voteCount.toLocaleString()} votes</span>
    </span>
  );
};

export default ContestantVoteDisplay;
