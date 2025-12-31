import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { CalendarIcon, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ImageUpload } from '@/components/ui/image-upload';
import { CustomSlugInput, validateCustomSlug } from '@/components/ui/custom-slug-input';
import { useCreateNomination } from '@/hooks/useNominations';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  logo_url: z.string().optional(),
  start_date: z.date({ required_error: 'Start date is required' }),
  end_date: z.date({ required_error: 'End date is required' }),
  custom_slug: z.string().optional(),
}).refine((data) => data.end_date > data.start_date, {
  message: 'End date must be after start date',
  path: ['end_date'],
}).refine((data) => {
  if (data.custom_slug && data.custom_slug.length === 5) {
    return false;
  }
  return true;
}, {
  message: 'Custom URL cannot be exactly 5 characters',
  path: ['custom_slug'],
});

type FormData = z.infer<typeof formSchema>;

export default function CreateNomination() {
  const navigate = useNavigate();
  const createNomination = useCreateNomination();
  const [logoUrl, setLogoUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      logo_url: '',
      custom_slug: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    // Validate custom slug
    const slugError = validateCustomSlug(customSlug);
    if (slugError) {
      toast.error(slugError);
      return;
    }

    const result = await createNomination.mutateAsync({
      title: data.title,
      description: data.description,
      logo_url: logoUrl || undefined,
      start_date: data.start_date.toISOString(),
      end_date: data.end_date.toISOString(),
      custom_slug: customSlug || undefined,
    });

    navigate(`/org/nominations/${result.id}`);
  };

  return (
    <OrganizationLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/org/nominations')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Nomination</h1>
            <p className="text-muted-foreground">Set up a new nomination campaign</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nomination Details</CardTitle>
            <CardDescription>
              Enter the basic information for your nomination campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Best Employee Awards 2025" {...field} />
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
                        <Textarea 
                          placeholder="Describe what this nomination is about..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Logo (Optional)</FormLabel>
                  <div className="mt-2">
                    <ImageUpload
                      bucket="contest-images"
                      value={logoUrl}
                      onChange={setLogoUrl}
                    />
                  </div>
                </div>

                <div>
                  <CustomSlugInput
                    value={customSlug}
                    onChange={setCustomSlug}
                    entityType="nomination"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/org/nominations')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createNomination.isPending}>
                    {createNomination.isPending ? 'Creating...' : 'Create Nomination'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </OrganizationLayout>
  );
}
