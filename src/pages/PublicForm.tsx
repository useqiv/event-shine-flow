import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicForm, useFormFields, useSubmitFormResponse, useCheckEmailSubmission, FormField } from '@/hooks/useForms';
import { Json } from '@/integrations/supabase/types';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { FileUploadField } from '@/components/forms/FileUploadField';
import StarRatingField from '@/components/forms/StarRatingField';
import DateTimePickerField from '@/components/forms/DateTimePickerField';
import MultiPageNavigation from '@/components/forms/MultiPageNavigation';
import FormPaymentSection from '@/components/forms/FormPaymentSection';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PublicForm = () => {
  const { formIdOrSlug } = useParams<{ formIdOrSlug: string }>();
  const { toast } = useToast();
  
  const { data: form, isLoading: formLoading } = usePublicForm(formIdOrSlug || '');
  const { data: fields, isLoading: fieldsLoading } = useFormFields(form?.id || '');
  const submitResponse = useSubmitFormResponse();

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateError, setDuplicateError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const checkEmail = useCheckEmailSubmission();
  const isLoading = formLoading || fieldsLoading;

  // Evaluate conditional logic to determine which fields should be visible
  const evaluateCondition = (field: FormField): boolean => {
    if (!field.conditional_logic || !field.conditional_logic.rules?.length) {
      return true; // No conditions, always show
    }

    const { action, logic_type, rules } = field.conditional_logic;
    
    const evaluateRule = (rule: { field_id: string; operator: string; value: string }): boolean => {
      const fieldValue = formData[rule.field_id];
      const compareValue = rule.value;
      
      switch (rule.operator) {
        case 'equals':
          return String(fieldValue) === compareValue;
        case 'not_equals':
          return String(fieldValue) !== compareValue;
        case 'contains':
          return String(fieldValue).toLowerCase().includes(compareValue.toLowerCase());
        case 'not_contains':
          return !String(fieldValue).toLowerCase().includes(compareValue.toLowerCase());
        case 'is_empty':
          return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0);
        case 'is_not_empty':
          return fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0);
        default:
          return true;
      }
    };

    const results = rules.map(evaluateRule);
    const conditionMet = logic_type === 'all' 
      ? results.every(Boolean) 
      : results.some(Boolean);

    return action === 'show' ? conditionMet : !conditionMet;
  };

  // Get visible fields for current page
  const visibleFields = useMemo(() => {
    if (!fields) return [];
    return fields
      .filter(field => (field.page_number || 1) === currentPage)
      .filter(evaluateCondition);
  }, [fields, currentPage, formData]);

  const totalPages = form?.total_pages || 1;

  const validateCurrentPage = (): boolean => {
    const newErrors: Record<string, string> = {};

    visibleFields.forEach((field) => {
      if (field.is_required) {
        const value = formData[field.id];
        if (value === undefined || value === null || value === '' || 
            (Array.isArray(value) && value.length === 0)) {
          newErrors[field.id] = 'This field is required';
        }
      }

      // Email validation
      if (field.field_type === 'email' && formData[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(formData[field.id]))) {
          newErrors[field.id] = 'Please enter a valid email address';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePageChange = (page: number) => {
    if (page > currentPage && !validateCurrentPage()) {
      return; // Don't proceed if validation fails
    }
    setCurrentPage(page);
  };

  const handleFlutterwavePayment = async () => {
    if (!form) return;
    
    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      // Get user email for payment
      const email = respondentEmail || 'guest@example.com';
      const tx_ref = `FORM-${form.id}-${Date.now()}`;

      const { data, error } = await supabase.functions.invoke('process-flutterwave-payment', {
        body: {
          amount: form.payment_amount,
          currency: form.payment_currency,
          email,
          name: respondentName || 'Form Respondent',
          tx_ref,
          meta: {
            form_id: form.id,
            type: 'form_submission',
          },
          redirect_url: `${window.location.origin}/payment-callback?type=form&form_id=${form.id}&tx_ref=${tx_ref}`,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.data?.link) {
        // Store pending form data in localStorage
        localStorage.setItem(`form_pending_${tx_ref}`, JSON.stringify({
          form_id: form.id,
          respondent_name: respondentName,
          respondent_email: respondentEmail,
          response_data: formData,
          payment_amount: form.payment_amount,
        }));
        window.location.href = data.data.link;
      } else {
        throw new Error('Payment link not received');
      }
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Payment failed');
      setIsProcessingPayment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateError(false);
    
    if (!form || !validateCurrentPage()) return;

    // If on last page and requires payment, handle payment flow
    if (currentPage === totalPages && form.requires_payment && form.payment_amount > 0) {
      await handleFlutterwavePayment();
      return;
    }

    // Check for duplicate submission if not allowing multiple
    if (!form.allow_multiple_submissions && respondentEmail) {
      const hasPreviousSubmission = await checkEmail.mutateAsync({
        form_id: form.id,
        email: respondentEmail,
      });

      if (hasPreviousSubmission) {
        setDuplicateError(true);
        return;
      }
    }

    try {
      await submitResponse.mutateAsync({
        form_id: form.id,
        respondent_name: respondentName || null,
        respondent_email: respondentEmail || null,
        response_data: formData as Json,
      });

      setIsSubmitted(true);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleFieldChange = (fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    const currentValues = (formData[fieldId] as string[]) || [];
    if (checked) {
      handleFieldChange(fieldId, [...currentValues, option]);
    } else {
      handleFieldChange(fieldId, currentValues.filter((v) => v !== option));
    }
  };

  const renderField = (field: FormField) => {
    const hasError = !!errors[field.id];
    const baseInputClass = `h-11 bg-background transition-all focus-visible:ring-2 focus-visible:ring-primary/20 ${hasError ? 'border-destructive focus-visible:ring-destructive/20' : 'hover:border-primary/50'}`;

    switch (field.field_type) {
      case 'first_name':
      case 'last_name':
      case 'text':
      case 'email':
      case 'number':
        return (
          <Input
            type={field.field_type === 'email' ? 'email' : field.field_type === 'number' ? 'number' : 'text'}
            placeholder={field.placeholder || ''}
            value={(formData[field.id] as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseInputClass}
          />
        );

      case 'phone':
        return (
          <Input
            type="tel"
            placeholder={field.placeholder || 'Enter phone number'}
            value={(formData[field.id] as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseInputClass}
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            placeholder={field.placeholder || 'https://example.com'}
            value={(formData[field.id] as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseInputClass}
          />
        );

      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder || ''}
            value={(formData[field.id] as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            rows={4}
            className={`resize-none transition-all focus-visible:ring-2 focus-visible:ring-primary/20 ${hasError ? 'border-destructive focus-visible:ring-destructive/20' : 'hover:border-primary/50'}`}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={(formData[field.id] as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseInputClass}
          />
        );

      case 'time':
        return (
          <Input
            type="time"
            value={(formData[field.id] as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseInputClass}
          />
        );

      case 'datetime':
        return (
          <Input
            type="datetime-local"
            value={(formData[field.id] as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseInputClass}
          />
        );

      case 'datetime_picker':
        return (
          <DateTimePickerField
            value={formData[field.id] as string | null}
            onChange={(value) => handleFieldChange(field.id, value)}
            type="datetime"
            placeholder={field.placeholder || 'Select date and time'}
            hasError={hasError}
          />
        );

      case 'dropdown':
        return (
          <Select
            value={(formData[field.id] as string) || ''}
            onValueChange={(value) => handleFieldChange(field.id, value)}
          >
            <SelectTrigger className={`h-11 transition-all hover:border-primary/50 ${hasError ? 'border-destructive' : ''}`}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg">
              {(field.options as string[] || []).map((option) => (
                <SelectItem key={option} value={option} className="cursor-pointer">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup
            value={(formData[field.id] as string) || ''}
            onValueChange={(value) => handleFieldChange(field.id, value)}
            className="space-y-3"
          >
            {(field.options as string[] || []).map((option) => (
              <div key={option} className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                <Label htmlFor={`${field.id}-${option}`} className="font-normal cursor-pointer flex-1">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="space-y-3">
            {(field.options as string[] || []).map((option) => (
              <div key={option} className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                <Checkbox
                  id={`${field.id}-${option}`}
                  checked={((formData[field.id] as string[]) || []).includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange(field.id, option, !!checked)}
                />
                <Label htmlFor={`${field.id}-${option}`} className="font-normal cursor-pointer flex-1">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'yes_no':
        return (
          <RadioGroup
            value={(formData[field.id] as string) || ''}
            onValueChange={(value) => handleFieldChange(field.id, value)}
            className="flex gap-4"
          >
            <div className={`flex-1 flex items-center justify-center space-x-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${(formData[field.id] as string) === 'yes' ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/50'}`}>
              <RadioGroupItem value="yes" id={`${field.id}-yes`} />
              <Label htmlFor={`${field.id}-yes`} className="font-medium cursor-pointer">Yes</Label>
            </div>
            <div className={`flex-1 flex items-center justify-center space-x-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${(formData[field.id] as string) === 'no' ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/50'}`}>
              <RadioGroupItem value="no" id={`${field.id}-no`} />
              <Label htmlFor={`${field.id}-no`} className="font-medium cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        );

      case 'rating':
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                type="button"
                variant={(formData[field.id] as number) === rating ? 'default' : 'outline'}
                size="icon"
                className={`h-12 w-12 text-lg font-semibold transition-all ${(formData[field.id] as number) === rating ? '' : 'hover:border-primary/50 hover:bg-primary/5'}`}
                onClick={() => handleFieldChange(field.id, rating)}
              >
                {rating}
              </Button>
            ))}
          </div>
        );

      case 'star_rating':
        return (
          <StarRatingField
            value={formData[field.id] as number | null}
            onChange={(value) => handleFieldChange(field.id, value)}
            maxRating={5}
            size="lg"
            hasError={hasError}
          />
        );

      case 'scale':
        return (
          <div className="space-y-2">
            <div className="flex gap-1 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={(formData[field.id] as number) === value ? 'default' : 'outline'}
                  size="sm"
                  className={`w-10 h-10 font-medium transition-all ${(formData[field.id] as number) === value ? '' : 'hover:border-primary/50 hover:bg-primary/5'}`}
                  onClick={() => handleFieldChange(field.id, value)}
                >
                  {value}
                </Button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>Not likely</span>
              <span>Very likely</span>
            </div>
          </div>
        );

      case 'file':
        return (
          <FileUploadField
            fieldId={field.id}
            value={(formData[field.id] as string) || null}
            onChange={(url) => handleFieldChange(field.id, url)}
            placeholder={field.placeholder || undefined}
            hasError={hasError}
          />
        );

      case 'address':
        return (
          <div className="space-y-3">
            <Input
              placeholder="Street Address"
              value={((formData[field.id] as Record<string, string>) || {}).street || ''}
              onChange={(e) => handleFieldChange(field.id, { 
                ...((formData[field.id] as Record<string, string>) || {}), 
                street: e.target.value 
              })}
              className={`h-11 transition-all hover:border-primary/50 ${hasError ? 'border-destructive' : ''}`}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="City"
                value={((formData[field.id] as Record<string, string>) || {}).city || ''}
                onChange={(e) => handleFieldChange(field.id, { 
                  ...((formData[field.id] as Record<string, string>) || {}), 
                  city: e.target.value 
                })}
                className="h-11 transition-all hover:border-primary/50"
              />
              <Input
                placeholder="State/Province"
                value={((formData[field.id] as Record<string, string>) || {}).state || ''}
                onChange={(e) => handleFieldChange(field.id, { 
                  ...((formData[field.id] as Record<string, string>) || {}), 
                  state: e.target.value 
                })}
                className="h-11 transition-all hover:border-primary/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="ZIP/Postal Code"
                value={((formData[field.id] as Record<string, string>) || {}).zip || ''}
                onChange={(e) => handleFieldChange(field.id, { 
                  ...((formData[field.id] as Record<string, string>) || {}), 
                  zip: e.target.value 
                })}
                className="h-11 transition-all hover:border-primary/50"
              />
              <Input
                placeholder="Country"
                value={((formData[field.id] as Record<string, string>) || {}).country || ''}
                onChange={(e) => handleFieldChange(field.id, { 
                  ...((formData[field.id] as Record<string, string>) || {}), 
                  country: e.target.value 
                })}
                className="h-11 transition-all hover:border-primary/50"
              />
            </div>
          </div>
        );

      case 'heading':
        return (
          <div className="pt-4">
            <h3 className="text-xl font-semibold text-foreground">{field.label}</h3>
            {field.description && <p className="text-muted-foreground mt-1">{field.description}</p>}
          </div>
        );

      case 'paragraph':
        return (
          <p className="text-muted-foreground leading-relaxed">{field.description || field.label}</p>
        );

      case 'divider':
        return <hr className="border-t border-border/50 my-2" />;

      case 'image':
        return field.placeholder ? (
          <img src={field.placeholder} alt={field.label} className="max-w-full rounded-xl shadow-sm" />
        ) : null;

      default:
        return (
          <Input
            placeholder={field.placeholder || ''}
            value={(formData[field.id] as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseInputClass}
          />
        );
    }
  };

  // Check if form is within schedule
  const isWithinSchedule = () => {
    if (!form) return false;
    const now = new Date();
    if (form.start_date && new Date(form.start_date) > now) return false;
    if (form.end_date && new Date(form.end_date) < now) return false;
    return true;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 pt-28">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader className="space-y-3 pb-6 border-b">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 pt-28">
          <div className="max-w-md mx-auto">
            <Card className="shadow-lg border-0">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Form Not Found</h1>
                <p className="text-muted-foreground">
                  This form doesn't exist or is no longer available.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!form.is_accepting_responses && !isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 pt-28">
          <div className="max-w-md mx-auto">
            <Card className="shadow-lg border-0">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold mb-2">{form.title}</h1>
                <p className="text-muted-foreground">
                  This form is no longer accepting responses.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isWithinSchedule() && !isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 pt-28">
          <div className="max-w-md mx-auto">
            <Card className="shadow-lg border-0">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold mb-2">{form.title}</h1>
                <p className="text-muted-foreground">
                  {form.start_date && new Date(form.start_date) > new Date() 
                    ? 'This form is not yet open for submissions.'
                    : 'This form is no longer accepting submissions.'}
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Helmet>
          <title>{form.title} | VoteApp</title>
        </Helmet>
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 pt-28">
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-lg border-0">
              <CardContent className="py-20 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold mb-3">Response Submitted!</h1>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  {form.confirmation_message || 'Thank you for your response!'}
                </p>
                <Button
                  className="mt-8"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({});
                    setRespondentName('');
                    setRespondentEmail('');
                    setCurrentPage(1);
                  }}
                >
                  Submit Another Response
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isLastPage = currentPage === totalPages;
  const showPaymentSection = isLastPage && form.requires_payment && form.payment_amount > 0;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/50 to-background">
      <Helmet>
        <title>{form.title} | VoteApp</title>
        <meta name="description" content={form.description || `Fill out ${form.title}`} />
      </Helmet>
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 pt-28">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="text-2xl md:text-3xl font-bold">{form.title}</CardTitle>
              {form.description && (
                <CardDescription className="text-base leading-relaxed">{form.description}</CardDescription>
              )}
              {totalPages > 1 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Step {currentPage} of {totalPages}</span>
                    <span className="text-muted-foreground">{Math.round((currentPage / totalPages) * 100)}% complete</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(currentPage / totalPages) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-2 pb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {duplicateError && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                    You have already submitted a response to this form.
                  </div>
                )}

                {visibleFields.map((field) => {
                  // Skip label for layout fields
                  if (['heading', 'paragraph', 'divider', 'image'].includes(field.field_type)) {
                    return (
                      <div key={field.id}>
                        {renderField(field)}
                      </div>
                    );
                  }

                  return (
                    <div key={field.id} className="space-y-2">
                      <Label className="flex items-center gap-1 text-sm font-medium">
                        {field.label}
                        {field.is_required && <span className="text-destructive">*</span>}
                      </Label>
                      {field.description && (
                        <p className="text-xs text-muted-foreground">{field.description}</p>
                      )}
                      {renderField(field)}
                      {errors[field.id] && (
                        <p className="text-xs text-destructive mt-1">{errors[field.id]}</p>
                      )}
                    </div>
                  );
                })}

                {showPaymentSection && (
                  <FormPaymentSection
                    amount={form.payment_amount}
                    currency={form.payment_currency}
                    onPay={handleFlutterwavePayment}
                    isProcessing={isProcessingPayment}
                    paymentError={paymentError}
                  />
                )}

                <div className="pt-6 border-t border-border/30 flex gap-3">
                  {totalPages > 1 && currentPage > 1 && (
                    <Button 
                      type="button" 
                      variant="outline"
                      className="flex-1 h-12"
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                  )}
                  
                  {!isLastPage ? (
                    <Button 
                      type="button" 
                      className="flex-1 h-12 text-base font-semibold"
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </Button>
                  ) : !showPaymentSection && (
                    <Button 
                      type="submit" 
                      className="flex-1 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all" 
                      disabled={submitResponse.isPending}
                    >
                      {submitResponse.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit'
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
          <p className="text-center text-xs text-muted-foreground mt-8 flex items-center justify-center gap-1.5">
            <span>Powered by</span>
            <span className="font-medium text-foreground/70">VoteApp Forms</span>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PublicForm;