import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, CheckCircle2, Search, ArrowLeft, Award, Send, Users, Info } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import SocialShareButtons from '@/components/SocialShareButtons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  usePublicNomination,
  usePublicNominationCategories,
  useSubmitNomination,
  useCheckPreviousNomination,
} from '@/hooks/useNominations';
import { useAuth } from '@/contexts/AuthContext';

export default function PublicNomination() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: nomination, isLoading: nominationLoading } = usePublicNomination(id!);
  // Use actual nomination ID for categories (not the slug from URL)
  const { data: categories, isLoading: categoriesLoading } = usePublicNominationCategories(nomination?.id || '');
  const submitNomination = useSubmitNomination();

  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null);
  const [nomineeName, setNomineeName] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [isNominateModalOpen, setIsNominateModalOpen] = useState(false);

  // Check if this email has already submitted to this category
  const { data: previousNomination, isLoading: checkingPrevious } = useCheckPreviousNomination(
    selectedCategory?.id || '',
    submitterEmail
  );

  // Auto-fill email for authenticated users
  useEffect(() => {
    if (user?.email) {
      setSubmitterEmail(user.email);
    }
  }, [user]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    if (!categorySearch.trim()) return categories;
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(categorySearch.toLowerCase()))
    );
  }, [categories, categorySearch]);

  const handleNominateClick = (category: { id: string; name: string }) => {
    setSelectedCategory(category);
    setIsNominateModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory || !nomineeName.trim() || !submitterEmail.trim()) {
      return;
    }

    await submitNomination.mutateAsync({
      category_id: selectedCategory.id,
      nominee_name: nomineeName.trim(),
      submitter_name: submitterName.trim() || undefined,
      submitter_email: submitterEmail.trim(),
    });

    setSubmitted(true);
    setNomineeName('');
    setSubmitterName('');
    setSubmitterEmail('');
  };

  const handleSubmitAnother = () => {
    setSubmitted(false);
    setSelectedCategory(null);
  };

  const handleCloseModal = () => {
    setIsNominateModalOpen(false);
    setSubmitted(false);
    setNomineeName('');
    setSubmitterName('');
    setSubmitterEmail('');
    setSelectedCategory(null);
  };

  if (nominationLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!nomination) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Nomination not found</h2>
          <p className="text-muted-foreground mt-2">
            This nomination doesn't exist or is no longer active.
          </p>
          <Link to="/">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const now = new Date();
  const start = new Date(nomination.start_date);
  const end = new Date(nomination.end_date);
  const isOpen = now >= start && now <= end && nomination.is_active;
  const isPending = now < start;
  const isClosed = now > end;

  return (
    <>
      <Helmet>
        <title>{nomination.title} | Submit Nomination</title>
        <meta name="description" content={nomination.description || `Submit your nomination for ${nomination.title}`} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 pt-24 pb-8">
          <div className="space-y-6">
            {/* Back Button */}
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>

            {/* Nomination Details */}
            <Card className="overflow-hidden">
              <div className="relative h-64 md:h-96 bg-secondary">
                {nomination.logo_url ? (
                  <img 
                    src={nomination.logo_url} 
                    alt={nomination.title} 
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <Award className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge variant={isOpen ? 'default' : 'secondary'}>
                    {isOpen ? 'Open for Nominations' : isPending ? 'Coming Soon' : 'Closed'}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <h1 className="text-2xl md:text-3xl font-bold">{nomination.title}</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nomination Period</p>
                      <p className="font-medium">
                        {format(start, 'MMM d, yyyy')} - {format(end, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Categories</p>
                      <p className="font-medium">{categories?.length || 0} Categories Available</p>
                    </div>
                  </div>
                </div>

                {nomination.description && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">About this Nomination</h3>
                    <p className="text-muted-foreground">{nomination.description}</p>
                  </div>
                )}

                {/* Status Message */}
                {!isOpen && (
                  <div className="mt-6 p-4 rounded-lg bg-muted">
                    <p className="text-center text-muted-foreground">
                      {isPending 
                        ? `Nominations open on ${format(start, 'MMMM d, yyyy')}`
                        : 'This nomination period has ended.'
                      }
                    </p>
                  </div>
                )}

                {/* Social Share */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-3">Share this nomination</h3>
                  <SocialShareButtons
                    url={`${window.location.origin}/nominations/${id}`}
                    title={nomination.title}
                    description={nomination.description || `Submit your nomination for ${nomination.title}`}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Categories Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Categories</h2>
                {categories && categories.length > 0 && (
                  <Badge variant="outline">{categories.length} Total</Badge>
                )}
              </div>

              {/* Category Search */}
              {categories && categories.length > 3 && (
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              )}

              {categoriesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : filteredCategories && filteredCategories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCategories.map((category) => (
                    <Card key={category.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3 h-full">
                          <div className="flex-1">
                            <h3 className="font-semibold">{category.name}</h3>
                            {category.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {category.description}
                              </p>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleNominateClick({ id: category.id, name: category.name })}
                            disabled={!isOpen}
                            className="w-full"
                          >
                            <Send className="mr-2 h-4 w-4" />
                            {isOpen ? 'Nominate' : isPending ? 'Coming Soon' : 'Closed'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : categories && categories.length > 0 && categorySearch ? (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">
                    No categories found matching "{categorySearch}"
                  </p>
                </Card>
              ) : (
                <Card className="p-6 text-center">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No categories available yet</p>
                </Card>
              )}
            </div>
          </div>

          {/* Nomination Modal */}
          <Dialog open={isNominateModalOpen} onOpenChange={handleCloseModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Submit Nomination</DialogTitle>
                <DialogDescription>
                  Nominate someone for: <strong>{selectedCategory?.name}</strong>
                </DialogDescription>
              </DialogHeader>
              
              {submitted ? (
                <div className="text-center py-6">
                  <div className="rounded-full bg-primary/10 p-4 inline-flex mb-4">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
                  <p className="text-muted-foreground mb-4">
                    Your nomination has been submitted successfully.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleCloseModal} className="flex-1">
                      Close
                    </Button>
                    <Button onClick={handleSubmitAnother} className="flex-1">
                      Nominate Another
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
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
                    <Label htmlFor="submitter-email">Your Email *</Label>
                    <Input
                      id="submitter-email"
                      type="email"
                      placeholder="Enter your email"
                      value={submitterEmail}
                      onChange={(e) => setSubmitterEmail(e.target.value)}
                      className="mt-1"
                      required
                    />
                    {/* Show info if email has previously nominated in this category */}
                    {previousNomination && previousNomination.length > 0 && (
                      <div className="flex items-start gap-2 mt-2 p-2 rounded-md bg-muted text-sm">
                        <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">
                          You've previously nominated {previousNomination.length === 1 
                            ? `"${previousNomination[0].nominee_name}"` 
                            : `${previousNomination.length} people`} in this category. You can still submit another nomination.
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCloseModal}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      disabled={!nomineeName.trim() || !submitterEmail.trim() || submitNomination.isPending}
                    >
                      {submitNomination.isPending ? 'Submitting...' : 'Submit'}
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </main>
        <Footer />
      </div>
    </>
  );
}
