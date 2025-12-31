import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Clock, Gift, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface PowerVotingMomentProps {
  isActive: boolean;
  multiplier: number;
  endTime?: Date;
  onActivate?: () => void;
  className?: string;
}

export const PowerVotingMoment: React.FC<PowerVotingMomentProps> = ({
  isActive,
  multiplier = 2,
  endTime,
  onActivate,
  className,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!isActive || !endTime) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Ended');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isActive, endTime]);

  // Fire confetti when power voting activates
  useEffect(() => {
    if (isActive) {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#f97316', '#facc15', '#ef4444'],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#f97316', '#facc15', '#ef4444'],
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isActive]);

  if (!isActive) {
    return (
      <Card className={cn("overflow-hidden border-dashed", className)}>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Zap className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">Power Voting</p>
              <p className="text-xs text-muted-foreground">
                {multiplier}x vote multiplier available
              </p>
            </div>
          </div>
          {onActivate && (
            <Button size="sm" variant="outline" onClick={onActivate}>
              Learn More
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "overflow-hidden border-2 border-orange-500 bg-gradient-to-r from-orange-500/20 via-yellow-500/20 to-red-500/20",
        "animate-pulse",
        className
      )}
    >
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center animate-bounce">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-lg">POWER HOUR!</p>
                <Badge className="bg-orange-500 animate-pulse">
                  {multiplier}x VOTES
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                All votes count {multiplier}x right now!
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-orange-500">
              <Clock className="h-4 w-4" />
              <span className="font-mono font-bold text-xl">{timeLeft}</span>
            </div>
            <p className="text-xs text-muted-foreground">remaining</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PowerVotingMoment;
