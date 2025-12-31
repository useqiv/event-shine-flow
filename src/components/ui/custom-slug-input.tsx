import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link as LinkIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomSlugInputProps {
  value: string;
  onChange: (value: string) => void;
  entityType: 'contest' | 'event' | 'campaign' | 'nomination';
  label?: string;
  className?: string;
}

const entityPaths: Record<string, string> = {
  contest: '/c/',
  event: '/e/',
  campaign: '/p/',
  nomination: '/n/',
};

export function CustomSlugInput({
  value,
  onChange,
  entityType,
  label = 'Custom URL Slug',
  className,
}: CustomSlugInputProps) {
  const path = entityPaths[entityType];
  const previewUrl = value ? `${window.location.origin}${path}${value}` : null;
  
  // Validation: cannot be exactly 5 characters
  const isExactlyFiveChars = value.length === 5;
  const hasError = isExactlyFiveChars && value.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow lowercase letters, numbers, and hyphens
    const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    onChange(sanitized);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor="custom_slug" className="flex items-center gap-2">
        <LinkIcon className="h-4 w-4" />
        {label}
      </Label>
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
              {window.location.origin}{path}
            </span>
            <Input
              id="custom_slug"
              placeholder="my-custom-url"
              value={value}
              onChange={handleChange}
              className={cn(
                'rounded-l-none',
                hasError && 'border-destructive focus-visible:ring-destructive'
              )}
            />
          </div>
        </div>
      </div>
      
      {hasError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          URL slug cannot be exactly 5 characters long
        </p>
      )}
      
      {previewUrl && !hasError && (
        <p className="text-xs text-muted-foreground">
          Your {entityType} will be available at:{' '}
          <span className="font-mono text-primary">{previewUrl}</span>
        </p>
      )}
      
      <p className="text-xs text-muted-foreground">
        Use lowercase letters, numbers, and hyphens only. <span className="text-destructive font-medium">Note: URLs cannot be exactly 5 characters.</span>
      </p>
    </div>
  );
}

// Validation helper function for use in forms
export function validateCustomSlug(slug: string): string | null {
  if (!slug) return null; // Empty is valid (optional field)
  if (slug.length === 5) {
    return 'Custom URL cannot be exactly 5 characters';
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return 'Only lowercase letters, numbers, and hyphens allowed';
  }
  return null; // Valid
}
