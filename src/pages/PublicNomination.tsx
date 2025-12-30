import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  usePublicNomination,
  usePublicNominationCategories,
  useSubmitNomination,
} from '@/hooks/useNominations';

export default function PublicNomination() {
  const { id } = useParams<{ id: string }>();
  const { data: nomination, isLoading: nominationLoading } = usePublicNomination(id!);
  const { data: categories, isLoading: categoriesLoading } = usePublicNominationCategories(id!);
  const submitNomination = useSubmitNomination();

  const [selectedCategory, setSelectedCategory] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory || !nomineeName.trim()) {
      return;
    }

    await submitNomination.mutateAsync({
      category_id: selectedCategory,
      nominee_name: nomineeName.trim(),
      submitter_name: submitterName.trim() || undefined,
      submitter_email: submitterEmail.trim() || undefined,
    });

    setSubmitted(true);
    setNomineeName('');
    setSubmitterName('');
    setSubmitterEmail('');
    setSelectedCategory('');
  };

  const handleSubmitAnother = () => {
    setSubmitted(false);
  };

  if (nominationLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!nomination) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Nomination Not Found</h2>
            <p className="text-muted-foreground">
              This nomination doesn't exist or is no longer active.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const start = new Date(nomination.start_date);
  const end = new Date(nomination.end_date);
  const isOpen = now >= start && now <= end && nomination.is_active;

  return (
    <>
      <Helmet>
        <title>{nomination.title} | Submit Nomination</title>
        <meta name="description" content={nomination.description || `Submit your nomination for ${nomination.title}`} />
      </Helmet>

      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            {nomination.logo_url && (
              <div className="flex justify-center mb-4">
                <img 
                  src={nomination.logo_url} 
                  alt="Logo" 
                  className="h-20 w-20 rounded-lg object-cover"
                />
              </div>
            )}
            <CardTitle className="text-2xl">{nomination.title}</CardTitle>
            {nomination.description && (
              <CardDescription className="text-base">
                {nomination.description}
              </CardDescription>
            )}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
              <Calendar className="h-4 w-4" />
              <span>
                {format(start, 'MMM d, yyyy')} - {format(end, 'MMM d, yyyy')}
              </span>
            </div>
          </CardHeader>

          <CardContent>
            {!isOpen ? (
              <div className="text-center py-8">
                <Badge variant="secondary" className="mb-4">
                  {now < start ? 'Not Yet Open' : 'Closed'}
                </Badge>
                <p className="text-muted-foreground">
                  {now < start 
                    ? `Nominations open on ${format(start, 'MMMM d, yyyy')}`
                    : 'This nomination period has ended.'
                  }
                </p>
              </div>
            ) : submitted ? (
              <div className="text-center py-8">
                <div className="rounded-full bg-primary/10 p-4 inline-flex mb-4">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
                <p className="text-muted-foreground mb-4">
                  Your nomination has been submitted successfully.
                </p>
                <Button onClick={handleSubmitAnother}>
                  Submit Another Nomination
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  {categoriesLoading ? (
                    <Skeleton className="h-10 w-full mt-1" />
                  ) : categories && categories.length > 0 ? (
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      No categories available
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="nominee">Nominee Name *</Label>
                  <Input
                    id="nominee"
                    placeholder="Enter the name of your nominee"
                    value={nomineeName}
                    onChange={(e) => setNomineeName(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="submitter-name">Your Name (Optional)</Label>
                  <Input
                    id="submitter-name"
                    placeholder="Enter your name"
                    value={submitterName}
                    onChange={(e) => setSubmitterName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="submitter-email">Your Email (Optional)</Label>
                  <Input
                    id="submitter-email"
                    type="email"
                    placeholder="Enter your email"
                    value={submitterEmail}
                    onChange={(e) => setSubmitterEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!selectedCategory || !nomineeName.trim() || submitNomination.isPending}
                >
                  {submitNomination.isPending ? 'Submitting...' : 'Submit Nomination'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
