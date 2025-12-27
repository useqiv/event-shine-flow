import React, { useState, useEffect } from 'react';
import { Campaign, useUpdateCampaign } from '@/hooks/useCampaigns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const CATEGORIES = [
  'Medical',
  'Education',
  'Emergency',
  'Community',
  'Creative',
  'Business',
  'Sports',
  'Environment',
  'Animal',
  'Other',
];

interface EditCampaignDialogProps {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditCampaignDialog: React.FC<EditCampaignDialogProps> = ({
  campaign,
  open,
  onOpenChange,
}) => {
  const updateCampaign = useUpdateCampaign();
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    description: '',
    goal_amount: 0,
    category: '',
    end_date: '',
    image_url: '',
  });

  useEffect(() => {
    if (campaign) {
      setFormData({
        title: campaign.title,
        short_description: campaign.short_description || '',
        description: campaign.description || '',
        goal_amount: campaign.goal_amount,
        category: campaign.category,
        end_date: campaign.end_date ? campaign.end_date.split('T')[0] : '',
        image_url: campaign.image_url || '',
      });
    }
  }, [campaign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign) return;

    try {
      await updateCampaign.mutateAsync({
        id: campaign.id,
        title: formData.title,
        short_description: formData.short_description || null,
        description: formData.description || null,
        goal_amount: formData.goal_amount,
        category: formData.category,
        end_date: formData.end_date || null,
        image_url: formData.image_url || null,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Campaign</DialogTitle>
          <DialogDescription>
            Update your campaign details. Changes will be reflected immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Campaign Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter campaign title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="short_description">Short Description</Label>
            <Input
              id="short_description"
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              placeholder="Brief summary (shown in campaign cards)"
              maxLength={150}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Full Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of your campaign..."
              rows={5}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal_amount">Goal Amount ({campaign?.currency === 'USD' ? '$' : campaign?.currency === 'EUR' ? '€' : campaign?.currency === 'GBP' ? '£' : '₦'}) *</Label>
              <Input
                id="goal_amount"
                type="number"
                min="1000"
                value={formData.goal_amount}
                onChange={(e) => setFormData({ ...formData, goal_amount: Number(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">End Date</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for no end date
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateCampaign.isPending}>
              {updateCampaign.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCampaignDialog;
