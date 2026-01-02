import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DateTimePickerFieldProps {
  value: string | null;
  onChange: (value: string) => void;
  type: 'date' | 'time' | 'datetime';
  placeholder?: string;
  hasError?: boolean;
}

const DateTimePickerField = ({ 
  value, 
  onChange, 
  type,
  placeholder,
  hasError = false 
}: DateTimePickerFieldProps) => {
  const [date, setDate] = useState<Date | undefined>(value ? new Date(value) : undefined);
  const [time, setTime] = useState<string>(value ? format(new Date(value), 'HH:mm') : '12:00');

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      if (type === 'date') {
        onChange(format(selectedDate, 'yyyy-MM-dd'));
      } else if (type === 'datetime') {
        const [hours, mins] = time.split(':');
        selectedDate.setHours(parseInt(hours), parseInt(mins));
        onChange(selectedDate.toISOString());
      }
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (type === 'time') {
      onChange(newTime);
    } else if (type === 'datetime' && date) {
      const [hours, mins] = newTime.split(':');
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours), parseInt(mins));
      onChange(newDate.toISOString());
    }
  };

  if (type === 'time') {
    return (
      <div className="flex gap-2">
        <Select 
          value={value?.split(':')[0] || '12'} 
          onValueChange={(h) => handleTimeChange(`${h}:${value?.split(':')[1] || '00'}`)}
        >
          <SelectTrigger className={cn('w-24', hasError && 'border-destructive')}>
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent>
            {hours.map((hour) => (
              <SelectItem key={hour} value={hour}>
                {hour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="flex items-center text-lg font-medium">:</span>
        <Select 
          value={value?.split(':')[1] || '00'} 
          onValueChange={(m) => handleTimeChange(`${value?.split(':')[0] || '12'}:${m}`)}
        >
          <SelectTrigger className={cn('w-24', hasError && 'border-destructive')}>
            <SelectValue placeholder="Min" />
          </SelectTrigger>
          <SelectContent>
            {minutes.map((min) => (
              <SelectItem key={min} value={min}>
                {min}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2', type === 'datetime' && 'flex-wrap')}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal h-11',
              !date && 'text-muted-foreground',
              hasError && 'border-destructive',
              type === 'datetime' && 'flex-1 min-w-[180px]'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PPP') : <span>{placeholder || 'Pick a date'}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {type === 'datetime' && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Select 
            value={time.split(':')[0]} 
            onValueChange={(h) => handleTimeChange(`${h}:${time.split(':')[1]}`)}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {hours.map((hour) => (
                <SelectItem key={hour} value={hour}>
                  {hour}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-lg font-medium">:</span>
          <Select 
            value={time.split(':')[1]} 
            onValueChange={(m) => handleTimeChange(`${time.split(':')[0]}:${m}`)}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {minutes.map((min) => (
                <SelectItem key={min} value={min}>
                  {min}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default DateTimePickerField;
