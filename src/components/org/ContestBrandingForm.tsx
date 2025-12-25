import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { Palette, Link as LinkIcon, Image } from 'lucide-react';

interface ContestBrandingFormProps {
  values: {
    custom_slug: string;
    brand_primary_color: string;
    brand_secondary_color: string;
    brand_logo_url: string;
  };
  onChange: (field: string, value: string) => void;
  contestId?: string;
}

export const ContestBrandingForm: React.FC<ContestBrandingFormProps> = ({
  values,
  onChange,
  contestId,
}) => {
  const previewUrl = values.custom_slug 
    ? `${window.location.origin}/c/${values.custom_slug}`
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Branding & Custom URL
        </CardTitle>
        <CardDescription>Customize the look and feel of your contest</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Custom URL Slug */}
        <div className="space-y-2">
          <Label htmlFor="custom_slug" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Custom URL Slug
          </Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                  {window.location.origin}/c/
                </span>
                <Input
                  id="custom_slug"
                  placeholder="my-contest"
                  value={values.custom_slug}
                  onChange={(e) => onChange('custom_slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="rounded-l-none"
                />
              </div>
            </div>
          </div>
          {previewUrl && (
            <p className="text-xs text-muted-foreground">
              Your contest will be available at: <span className="font-mono text-primary">{previewUrl}</span>
            </p>
          )}
        </div>

        {/* Brand Colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brand_primary_color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="brand_primary_color"
                value={values.brand_primary_color}
                onChange={(e) => onChange('brand_primary_color', e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={values.brand_primary_color}
                onChange={(e) => onChange('brand_primary_color', e.target.value)}
                placeholder="#7c3aed"
                className="flex-1 font-mono"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand_secondary_color">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="brand_secondary_color"
                value={values.brand_secondary_color}
                onChange={(e) => onChange('brand_secondary_color', e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={values.brand_secondary_color}
                onChange={(e) => onChange('brand_secondary_color', e.target.value)}
                placeholder="#f97316"
                className="flex-1 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Color Preview */}
        <div className="space-y-2">
          <Label>Color Preview</Label>
          <div className="flex gap-2 h-12 rounded-lg overflow-hidden">
            <div 
              className="flex-1 flex items-center justify-center text-white font-medium"
              style={{ backgroundColor: values.brand_primary_color }}
            >
              Primary
            </div>
            <div 
              className="flex-1 flex items-center justify-center text-white font-medium"
              style={{ backgroundColor: values.brand_secondary_color }}
            >
              Secondary
            </div>
          </div>
        </div>

        {/* Brand Logo */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Brand Logo
          </Label>
          <ImageUpload
            bucket="contest-images"
            value={values.brand_logo_url}
            onChange={(url) => onChange('brand_logo_url', url)}
            label="Upload your logo (recommended: 200x50px)"
          />
          <p className="text-xs text-muted-foreground">
            This logo will appear on share cards and the contest page
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
