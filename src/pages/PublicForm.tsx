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
          <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-all hover:border-primary/50 hover:bg-primary/5 ${hasError ? 'border-destructive' : 'border-border/50'}`}>
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFieldChange(field.id, file.name);
                }
              }}
              className="hidden"
              id={`file-${field.id}`}
            />
            <label htmlFor={`file-${field.id}`} className="cursor-pointer">
              <div className="text-muted-foreground">
                <p className="font-medium">Click to upload a file</p>
                <p className="text-sm">or drag and drop</p>
              </div>
              {formData[field.id] && (
                <p className="mt-2 text-sm text-primary font-medium">{formData[field.id] as string}</p>
              )}
            </label>
          </div>
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
        ) : (
          <div className="bg-muted/50 rounded-xl p-12 text-center text-muted-foreground border border-dashed">
            Image placeholder
          </div>
        );

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
            </CardHeader>
            <CardContent className="pt-2 pb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {(() => {
                  const renderedFields: React.ReactNode[] = [];
                  let i = 0;
                  
                  // Field types that should be paired on the same line
                  const pairableFields = ['first_name', 'last_name', 'text', 'email', 'phone', 'number', 'date', 'time', 'url'];
                  
                  // Check if two fields should be paired
                  const shouldPairFields = (field1: FormField, field2: FormField | undefined): boolean => {
                    if (!field2) return false;
                    
                    // Name pair (first_name + last_name)
                    if ((field1.field_type === 'first_name' && field2.field_type === 'last_name') ||
                        (field1.field_type === 'last_name' && field2.field_type === 'first_name')) {
                      return true;
                    }
                    
                    // Date + Time pair
                    if ((field1.field_type === 'date' && field2.field_type === 'time') ||
                        (field1.field_type === 'time' && field2.field_type === 'date')) {
                      return true;
                    }
                    
                    // Email + Phone pair
                    if ((field1.field_type === 'email' && field2.field_type === 'phone') ||
                        (field1.field_type === 'phone' && field2.field_type === 'email')) {
                      return true;
                    }
                    
                    // Two short text fields in a row (both must be simple input types)
                    if (pairableFields.includes(field1.field_type) && 
                        pairableFields.includes(field2.field_type) &&
                        field1.field_type === field2.field_type &&
                        field1.field_type === 'text') {
                      return true;
                    }
                    
                    return false;
                  };
                  
                  while (i < (fields?.length || 0)) {
                    const field = fields![i];
                    const nextField = fields![i + 1];
                    
                    const shouldPair = shouldPairFields(field, nextField);
                    
                    if (shouldPair && nextField) {
                      // Render both fields on the same line
                      renderedFields.push(
                        <div key={`${field.id}-${nextField.id}`} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                          <div className="space-y-2">
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
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1 text-sm font-medium">
                              {nextField.label}
                              {nextField.is_required && <span className="text-destructive">*</span>}
                            </Label>
                            {nextField.description && (
                              <p className="text-xs text-muted-foreground">{nextField.description}</p>
                            )}
                            {renderField(nextField)}
                            {errors[nextField.id] && (
                              <p className="text-xs text-destructive mt-1">{errors[nextField.id]}</p>
                            )}
                          </div>
                        </div>
                      );
                      i += 2; // Skip both fields
                    } else {
                      // Render single field normally
                      renderedFields.push(
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
                      i += 1;
                    }
                  }
                  return renderedFields;
                })()}

                <div className="pt-6 border-t border-border/30">
                  <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all" disabled={submitResponse.isPending}>
                    {submitResponse.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit'
                    )}
                  </Button>
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
