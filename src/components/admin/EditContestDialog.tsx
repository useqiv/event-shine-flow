import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const contestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(1000).optional(),
  category: z.string().min(1, 'Category is required'),
  vote_price: z.coerce.number().min(0, 'Vote price must be positive'),
  vote_currency: z.string().min(1, 'Currency is required'),
  is_featured: z.boolean(),
  is_active: z.boolean(),
  is_live_voting: z.boolean(),
  custom_slug: z.string().max(50).optional(),
});

type ContestFormData = z.infer<typeof contestSchema>;

interface EditContestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contest: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    vote_price: number;
    vote_currency: string;
    is_featured: boolean;
    is_active: boolean;
    is_live_voting: boolean;
    custom_slug: string | null;
  };
}

const EditContestDialog: React.FC<EditContestDialogProps> = ({
  open,
  onOpenChange,
  contest,
}) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ContestFormData>({
    resolver: zodResolver(contestSchema),
    defaultValues: {
      title: contest.title,
      description: contest.description || '',
      category: contest.category,
      vote_price: contest.vote_price,
      vote_currency: contest.vote_currency,
      is_featured: contest.is_featured,
      is_active: contest.is_active,
      is_live_voting: contest.is_live_voting,
      custom_slug: contest.custom_slug || '',
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        title: contest.title,
        description: contest.description || '',
        category: contest.category,
        vote_price: contest.vote_price,
        vote_currency: contest.vote_currency,
        is_featured: contest.is_featured,
        is_active: contest.is_active,
        is_live_voting: contest.is_live_voting,
        custom_slug: contest.custom_slug || '',
      });
    }
  }, [open, contest, form]);

  const onSubmit = async (data: ContestFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('contests')
        .update({
          title: data.title,
          description: data.description || null,
          category: data.category,
          vote_price: data.vote_price,
          vote_currency: data.vote_currency,
          is_featured: data.is_featured,
          is_active: data.is_active,
          is_live_voting: data.is_live_voting,
          custom_slug: data.custom_slug || null,
        })
        .eq('id', contest.id);

      if (error) throw error;

      toast.success('Contest updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-contest-detail', contest.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-contests'] });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating contest:', error);
      toast.error('Failed to update contest');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contest</DialogTitle>
          <DialogDescription>
            Make changes to the contest details. Click save when done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vote_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vote Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vote_currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="custom_slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom URL Slug (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="my-contest" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-wrap gap-6">
              <FormField
                control={form.control}
                name="is_featured"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Featured</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Active</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_live_voting"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Live Voting</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditContestDialog;
