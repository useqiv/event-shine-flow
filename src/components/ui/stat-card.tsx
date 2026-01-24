import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  isLoading?: boolean;
  variant?: 'default' | 'primary';
  description?: string;
}

/**
 * Reusable stat card component for dashboards
 * Supports loading state and primary variant
 */
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  isLoading = false,
  variant = 'default',
  description,
}) => {
  const isPrimary = variant === 'primary';

  return (
    <Card className={cn(isPrimary && 'bg-primary text-primary-foreground')}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={cn(
              'text-sm',
              isPrimary ? 'opacity-90' : 'text-muted-foreground'
            )}>
              {title}
            </p>
            {isLoading ? (
              <Skeleton className={cn(
                'h-8 w-24 mt-1',
                isPrimary && 'bg-primary-foreground/20'
              )} />
            ) : (
              <>
                <p className={cn(
                  'text-2xl font-bold',
                  !isPrimary && 'text-foreground'
                )}>
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
                {description && (
                  <p className={cn(
                    'text-xs mt-1',
                    isPrimary ? 'opacity-70' : 'text-muted-foreground'
                  )}>
                    {description}
                  </p>
                )}
              </>
            )}
          </div>
          <Icon className={cn(
            'h-8 w-8',
            isPrimary ? 'opacity-80' : 'text-muted-foreground'
          )} />
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
