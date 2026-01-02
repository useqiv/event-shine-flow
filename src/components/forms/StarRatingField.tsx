import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingFieldProps {
  value: number | null;
  onChange: (value: number) => void;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  hasError?: boolean;
}

const StarRatingField = ({ 
  value, 
  onChange, 
  maxRating = 5, 
  size = 'md',
  hasError = false 
}: StarRatingFieldProps) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const containerClasses = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3',
  };

  return (
    <div className={cn('flex items-center', containerClasses[size])}>
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          className={cn(
            'transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-sm',
            hasError && 'ring-1 ring-destructive'
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              'transition-colors duration-200',
              value !== null && rating <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-muted-foreground/40 hover:text-yellow-400/60'
            )}
          />
        </button>
      ))}
      {value !== null && (
        <span className="ml-2 text-sm text-muted-foreground">
          {value} / {maxRating}
        </span>
      )}
    </div>
  );
};

export default StarRatingField;
