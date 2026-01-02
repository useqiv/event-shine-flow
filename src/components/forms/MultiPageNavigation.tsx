import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface MultiPageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  canProceed?: boolean;
}

const MultiPageNavigation = ({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting = false,
  canProceed = true,
}: MultiPageNavigationProps) => {
  const progress = (currentPage / totalPages) * 100;
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <div className="space-y-4 pt-6 border-t border-border/30">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Step {currentPage} of {totalPages}
          </span>
          <span className="text-muted-foreground">
            {Math.round(progress)}% complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Page indicators */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <div
            key={page}
            className={cn(
              'w-2.5 h-2.5 rounded-full transition-all',
              page === currentPage
                ? 'bg-primary w-8'
                : page < currentPage
                ? 'bg-primary/60'
                : 'bg-muted-foreground/30'
            )}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-3">
        {!isFirstPage && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            className="flex-1 h-12"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
        )}

        {isLastPage ? (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!canProceed || isSubmitting}
            className={cn('h-12 text-base font-semibold shadow-lg', isFirstPage ? 'w-full' : 'flex-1')}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
            className={cn('h-12 text-base font-semibold', isFirstPage ? 'w-full' : 'flex-1')}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default MultiPageNavigation;
