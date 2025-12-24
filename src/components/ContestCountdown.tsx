import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContestCountdownProps {
  endDate: string;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

const ContestCountdown = ({ endDate, className }: ContestCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endDate).getTime();
      const now = new Date().getTime();
      const difference = end - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        total: difference,
      };
    };

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      // Urgent when less than 1 hour remaining
      setIsUrgent(newTimeLeft.total > 0 && newTimeLeft.total <= 60 * 60 * 1000);
    }, 1000);

    // Initial calculation
    const initialTimeLeft = calculateTimeLeft();
    setTimeLeft(initialTimeLeft);
    setIsUrgent(initialTimeLeft.total > 0 && initialTimeLeft.total <= 60 * 60 * 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  const isEnded = timeLeft.total <= 0;

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'w-14 h-14 rounded-lg flex items-center justify-center font-bold text-xl transition-all duration-300',
          isUrgent ? 'bg-destructive/20 text-destructive animate-pulse' : 'bg-secondary text-foreground',
          isEnded && 'bg-muted text-muted-foreground'
        )}
      >
        {String(value).padStart(2, '0')}
      </div>
      <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );

  if (isEnded) {
    return (
      <Card className={cn('border-destructive/50', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">Contest has ended</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(isUrgent && 'border-destructive/50 shadow-destructive/20 shadow-lg', className)}>
      <CardContent className="p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            {isUrgent ? (
              <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium text-muted-foreground">Time Remaining</span>
            {isUrgent && (
              <Badge variant="destructive" className="animate-pulse text-xs">
                Ending Soon!
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <TimeBlock value={timeLeft.days} label="Days" />
            <span className={cn('text-2xl font-bold', isUrgent ? 'text-destructive' : 'text-muted-foreground')}>:</span>
            <TimeBlock value={timeLeft.hours} label="Hours" />
            <span className={cn('text-2xl font-bold', isUrgent ? 'text-destructive' : 'text-muted-foreground')}>:</span>
            <TimeBlock value={timeLeft.minutes} label="Mins" />
            <span className={cn('text-2xl font-bold', isUrgent ? 'text-destructive' : 'text-muted-foreground')}>:</span>
            <TimeBlock value={timeLeft.seconds} label="Secs" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContestCountdown;
