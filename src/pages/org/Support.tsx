import React, { useState } from 'react';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useSupportTickets, useCreateSupportTicket } from '@/hooks/useOrganization';
import { HelpCircle, MessageSquare, PlusCircle, Book, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const faqs = [
  {
    question: 'How do I create a contest?',
    answer: 'Go to "Create Contest" from the sidebar, fill in the contest details including title, description, dates, and vote price. After creating, you can add contestants from the contest management page.'
  },
  {
    question: 'How do payouts work?',
    answer: 'Revenue from votes and ticket sales accumulates in your wallet. You can request a payout once you have a balance. Set up your bank details or USDT address in the Payouts section, then submit a payout request. Payouts are typically processed within 24-48 hours.'
  },
  {
    question: 'Can I edit a contest after creating it?',
    answer: 'Yes, you can edit contest details, add or remove contestants, and update settings from the contest management page. However, some changes may not be allowed once voting has started.'
  },
  {
    question: 'How do I track ticket sales?',
    answer: 'Go to the event management page for your event. You\'ll see real-time statistics on tickets sold, revenue, and a list of all attendees. You can also export the attendee list as CSV.'
  },
  {
    question: 'What payment methods do users have?',
    answer: 'Users can pay using their wallet balance, which they can fund via bank transfer, card payment, or voucher codes. They can also use promo codes for discounts.'
  },
];

const Support = () => {
  const { data: tickets, isLoading } = useSupportTickets();
  const createTicket = useCreateSupportTicket();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium',
  });

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.description) {
      return;
    }

    try {
      await createTicket.mutateAsync(newTicket);
      setIsCreateOpen(false);
      setNewTicket({
        subject: '',
        description: '',
        category: 'general',
        priority: 'medium',
      });
    } catch (error) {
      console.error('Failed to create ticket:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'in_progress': return 'secondary';
      case 'resolved': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Support</h1>
            <p className="text-muted-foreground">Get help and manage support tickets.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FAQ Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5" />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>Quick answers to common questions</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Support Tickets */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Your Support Tickets
                    </CardTitle>
                    <CardDescription>View and track your support requests</CardDescription>
                  </div>
                  <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Ticket
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Support Ticket</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Subject *</Label>
                          <Input
                            placeholder="Brief description of your issue"
                            value={newTicket.subject}
                            onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                              value={newTicket.category}
                              onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="technical">Technical Issue</SelectItem>
                                <SelectItem value="billing">Billing & Payments</SelectItem>
                                <SelectItem value="contest">Contests</SelectItem>
                                <SelectItem value="event">Events</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select
                              value={newTicket.priority}
                              onValueChange={(value) => setNewTicket(prev => ({ ...prev, priority: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Description *</Label>
                          <Textarea
                            placeholder="Describe your issue in detail..."
                            rows={4}
                            value={newTicket.description}
                            onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>

                        <Button onClick={handleCreateTicket} className="w-full" disabled={createTicket.isPending}>
                          {createTicket.isPending ? 'Creating...' : 'Submit Ticket'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                ) : tickets && tickets.length > 0 ? (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="p-4 rounded-lg border border-border">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{ticket.subject}</h4>
                          <div className="flex gap-2">
                            <Badge variant={getPriorityColor(ticket.priority) as any}>
                              {ticket.priority}
                            </Badge>
                            <Badge variant={getStatusColor(ticket.status) as any}>
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {ticket.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Opened {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No support tickets</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Need More Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Documentation
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Video Tutorials
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Contact Sales
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Email: support@useqiv.com</p>
                <p>WhatsApp: +234 800 000 0000</p>
                <p className="text-xs">Support hours: Mon-Fri, 9am-6pm WAT</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </OrganizationLayout>
  );
};

export default Support;
