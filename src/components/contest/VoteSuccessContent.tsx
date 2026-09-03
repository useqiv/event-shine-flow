import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface VoteSuccessContentProps {
  contestantName: string;
  onDone: () => void;
  primaryColor?: string;
}

export const VoteSuccessContent: React.FC<VoteSuccessContentProps> = ({
  contestantName,
  onDone,
  primaryColor,
}) => (
  <div className="flex flex-col items-center text-center py-6 sm:py-8 px-2 space-y-4">
    <div
      className="flex h-16 w-16 items-center justify-center rounded-full"
      style={{ backgroundColor: primaryColor ? `${primaryColor}20` : 'hsl(var(--primary) / 0.15)' }}
    >
      <CheckCircle2
        className="h-9 w-9"
        style={{ color: primaryColor || 'hsl(var(--primary))' }}
      />
    </div>
    <div className="space-y-2">
      <h3 className="text-xl font-semibold tracking-tight">Vote recorded</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
        Your vote for <span className="font-medium text-foreground">{contestantName}</span> has been counted successfully.
      </p>
    </div>
    <Button
      className="w-full sm:w-auto min-w-[140px] mt-2"
      onClick={onDone}
      style={primaryColor ? { backgroundColor: primaryColor, color: 'white' } : undefined}
    >
      Done
    </Button>
  </div>
);
