import React, { useState } from 'react';
import { useUpdateCampaign } from '@/hooks/useCampaigns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarPlus, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface ExtendDeadlineDialogProps {
  campaignId: string;
  currentEndDate: string | null;
  trigger?: React.ReactNode;
}

const QUICK_EXTENSIONS = [
  { label: '+7 days', days: 7 },
  { label: '+14 days', days: 14 },
  { label: '+30 days', days: 30 },
];

export const ExtendDeadlineDialog: React.FC<ExtendDeadlineDialogProps> = ({
  campaignId,
  currentEndDate,
  trigger,
}) => {
  const updateCampaign = useUpdateCampaign();
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    currentEndDate ? new Date(currentEndDate) : undefined
  );

  const baseDate = currentEndDate ? new Date(currentEndDate) : new Date();
  const minDate = startOfDay(addDays(new Date(), 1)); // At least tomorrow

  const handleQuickExtend = (days: number) => {
    const newDate = addDays(baseDate, days);
    setSelectedDate(newDate);
  };

  const handleSubmit = async () => {
    if (!selectedDate) return;

    try {
      await updateCampaign.mutateAsync({
        id: campaignId,
        end_date: selectedDate.toISOString(),
      });
      setOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isValidDate = selectedDate && !isBefore(selectedDate, minDate);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <CalendarPlus className="h-4 w-4 mr-2" />
            Extend Deadline
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Extend Campaign Deadline</DialogTitle>
          <DialogDescription>
            Give your campaign more time to reach its goal. Choose a new end date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Deadline */}
          {currentEndDate && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Current deadline</p>
              <p className="font-medium">{format(new Date(currentEndDate), 'MMMM d, yyyy')}</p>
            </div>
          )}

          {/* Quick Extensions */}
          <div className="space-y-2">
            <Label>Quick extend</Label>
            <div className="flex gap-2">
              {QUICK_EXTENSIONS.map(({ label, days }) => (
                <Button
                  key={days}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickExtend(days)}
                  className={cn(
                    selectedDate && 
                    format(selectedDate, 'yyyy-MM-dd') === format(addDays(baseDate, days), 'yyyy-MM-dd') &&
                    'border-primary bg-primary/10'
                  )}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Or choose a specific date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => isBefore(date, minDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* New Deadline Preview */}
          {selectedDate && isValidDate && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-muted-foreground">New deadline</p>
              <p className="font-medium text-primary">{format(selectedDate, 'MMMM d, yyyy')}</p>
              {currentEndDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Extended by {Math.ceil((selectedDate.getTime() - new Date(currentEndDate).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isValidDate || updateCampaign.isPending}
          >
            {updateCampaign.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Extend Deadline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
