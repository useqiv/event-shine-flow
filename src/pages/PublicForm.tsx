import { useState } from 'react';
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
import { usePublicForm, useFormFields, useSubmitFormResponse, FormField } from '@/hooks/useForms';
import { Json } from '@/integrations/supabase/types';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

const PublicForm = () => {
  const { formIdOrSlug } = useParams<{ formIdOrSlug: string }>();
  
  const { data: form, isLoading: formLoading } = usePublicForm(formIdOrSlug || '');
  const { data: fields, isLoading: fieldsLoading } = useFormFields(form?.id || '');
  const submitResponse = useSubmitFormResponse();

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLoading = formLoading || fieldsLoading;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields?.forEach((field) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form || !validateForm()) return;

    await submitResponse.mutateAsync({
      form_id: form.id,
      respondent_name: respondentName || undefined,
      respondent_email: respondentEmail || undefined,
      response_data: formData as Json,
    });

    setIsSubmitted(true);
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

    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <Input
            type={field.field_type}
            placeholder={field.placeholder || ''}
            value={(formData[field.id] as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={hasError ? 'border-destructive' : ''}
          />
        );

      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder || ''}
            value={(formData[field.id] as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            rows={4}
            className={hasError ? 'border-destructive' : ''}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={(formData[field.id] as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={hasError ? 'border-destructive' : ''}
          />
        );

      case 'dropdown':
        return (
          <Select
            value={(formData[field.id] as string) || ''}
            onValueChange={(value) => handleFieldChange(field.id, value)}
          >
            <SelectTrigger className={hasError ? 'border-destructive' : ''}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {(field.options as string[] || []).map((option) => (
                <SelectItem key={option} value={option}>
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
          >
            {(field.options as string[] || []).map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                <Label htmlFor={`${field.id}-${option}`} className="font-normal">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {(field.options as string[] || []).map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${option}`}
                  checked={((formData[field.id] as string[]) || []).includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange(field.id, option, !!checked)}
                />
                <Label htmlFor={`${field.id}-${option}`} className="font-normal">
                  {option}
                </Label>
              </div>
            ))}
          </div>
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
                onClick={() => handleFieldChange(field.id, rating)}
              >
                {rating}
              </Button>
            ))}
          </div>
        );

      case 'file':
        return (
          <Input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFieldChange(field.id, file.name);
              }
            }}
            className={hasError ? 'border-destructive' : ''}
          />
        );

      default:
        return (
          <Input
            placeholder={field.placeholder || ''}
            value={(formData[field.id] as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={hasError ? 'border-destructive' : ''}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24">
          <div className="max-w-2xl mx-auto space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24">
          <div className="max-w-2xl mx-auto text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Form Not Found</h1>
            <p className="text-muted-foreground">
              This form doesn't exist or is no longer available.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!form.is_accepting_responses && !isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24">
          <div className="max-w-2xl mx-auto text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">{form.title}</h1>
            <p className="text-muted-foreground">
              This form is no longer accepting responses.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Helmet>
          <title>{form.title} | VoteApp</title>
        </Helmet>
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="py-16 text-center">
                <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Response Submitted!</h1>
                <p className="text-muted-foreground">
                  {form.confirmation_message || 'Thank you for your response!'}
                </p>
                <Button
                  className="mt-6"
                  variant="outline"
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({});
                    setRespondentName('');
                    setRespondentEmail('');
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

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{form.title} | VoteApp</title>
        <meta name="description" content={form.description || `Fill out ${form.title}`} />
      </Helmet>
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{form.title}</CardTitle>
              {form.description && (
                <CardDescription>{form.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {fields?.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label className="flex items-center gap-1">
                      {field.label}
                      {field.is_required && <span className="text-destructive">*</span>}
                    </Label>
                    {field.description && (
                      <p className="text-sm text-muted-foreground">{field.description}</p>
                    )}
                    {renderField(field)}
                    {errors[field.id] && (
                      <p className="text-sm text-destructive">{errors[field.id]}</p>
                    )}
                  </div>
                ))}

                <Button type="submit" className="w-full" disabled={submitResponse.isPending}>
                  {submitResponse.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PublicForm;
