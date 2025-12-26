import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useIsFavorite, useToggleFavorite } from '@/hooks/useFavoriteContestants';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  contestantId: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'ghost' | 'outline';
  className?: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  contestantId,
  size = 'icon',
  variant = 'ghost',
  className,
}) => {
  const { user } = useAuth();
  const { data: isFavorite, isLoading: checkingFavorite } = useIsFavorite(contestantId);
  const { mutate: toggleFavorite, isPending } = useToggleFavorite();

  if (!user) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({ contestantId, isFavorite: !!isFavorite });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isPending || checkingFavorite}
      className={cn(
        "transition-all",
        isFavorite && "text-red-500 hover:text-red-600",
        className
      )}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart 
        className={cn(
          "h-4 w-4 transition-all",
          isFavorite && "fill-current"
        )} 
      />
    </Button>
  );
};
