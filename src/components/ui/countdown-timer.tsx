import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endDate: string;
  startDate?: string;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  endDate, 
  startDate,
  className = '' 
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [status, setStatus] = useState<'upcoming' | 'active' | 'ended'>('active');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const start = startDate ? new Date(startDate).getTime() : now;

      if (now < start) {
        // Contest hasn't started
        const difference = start - now;
        setStatus('upcoming');
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        };
      }

      if (now > end) {
        setStatus('ended');
        return null;
      }

      // Contest is active
      const difference = end - now;
      setStatus('active');
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate, startDate]);

  if (status === 'ended') {
    return (
      <div className={`flex items-center gap-2 text-destructive ${className}`}>
        <Clock className="h-4 w-4" />
        <span className="font-medium">Voting has ended</span>
      </div>
    );
  }

  if (!timeLeft) return null;

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-primary/10 text-primary font-bold text-lg md:text-xl px-2 md:px-3 py-1 rounded-lg min-w-[40px] md:min-w-[48px] text-center">
        {value.toString().padStart(2, '0')}
      </div>
      <span className="text-[10px] md:text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-1 mb-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {status === 'upcoming' ? 'Starts in' : 'Ends in'}
        </span>
      </div>
      <div className="flex items-center gap-1 md:gap-2">
        <TimeBlock value={timeLeft.days} label="Days" />
        <span className="text-lg font-bold text-muted-foreground">:</span>
        <TimeBlock value={timeLeft.hours} label="Hrs" />
        <span className="text-lg font-bold text-muted-foreground">:</span>
        <TimeBlock value={timeLeft.minutes} label="Min" />
        <span className="text-lg font-bold text-muted-foreground">:</span>
        <TimeBlock value={timeLeft.seconds} label="Sec" />
      </div>
    </div>
  );
};
