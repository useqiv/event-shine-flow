import * as React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export const RequiredMark = () => (
  <span className="text-destructive ml-0.5" aria-hidden="true">
    *
  </span>
);

interface FieldLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {
  required?: boolean;
}

export const FieldLabel = ({ required, children, className, ...props }: FieldLabelProps) => (
  <Label className={cn(className)} {...props}>
    {children}
    {required && <RequiredMark />}
  </Label>
);

export const RequiredFieldsNote = ({ className }: { className?: string }) => (
  <p className={cn('text-xs text-muted-foreground', className)}>
    Fields marked with <span className="text-destructive">*</span> are required.
  </p>
);
