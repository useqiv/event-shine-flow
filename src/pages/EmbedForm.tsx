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
import { usePublicForm, useFormFields, useSubmitFormResponse, useCheckEmailSubmission, FormField } from '@/hooks/useForms';
import { Json } from '@/integrations/supabase/types';
import { FileUploadField } from '@/components/forms/FileUploadField';

const EmbedForm = () => {
  const { formIdOrSlug } = useParams<{ formIdOrSlug: string }>();
  
  const { data: form, isLoading: formLoading } = usePublicForm(formIdOrSlug || '');
  const { data: fields, isLoading: fieldsLoading } = useFormFields(form?.id || '');
  const submitResponse = useSubmitFormResponse();
  const checkEmail = useCheckEmailSubmission();

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateError, setDuplicateError] = useState(false);

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
    setDuplicateError(false);
    
    if (!form || !validateForm()) return;

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
            className="space-y-2"
          >
            {(field.options as string[] || []).map((option) => (
              <div key={option} className="flex items-center space-x-3 p-2 rounded-lg border border-border/50 hover:border-primary/50 transition-all cursor-pointer">
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
          <div className="space-y-2">
            {(field.options as string[] || []).map((option) => (
              <div key={option} className="flex items-center space-x-3 p-2 rounded-lg border border-border/50 hover:border-primary/50 transition-all cursor-pointer">
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
            className="flex gap-3"
          >
            <div className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${(formData[field.id] as string) === 'yes' ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/50'}`}>
              <RadioGroupItem value="yes" id={`${field.id}-yes`} />
              <Label htmlFor={`${field.id}-yes`} className="font-medium cursor-pointer">Yes</Label>
            </div>
            <div className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${(formData[field.id] as string) === 'no' ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/50'}`}>
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
                className="h-10 w-10"
                onClick={() => handleFieldChange(field.id, rating)}
              >
                {rating}
              </Button>
            ))}
          </div>
        );

      case 'scale':
        return (
          <div className="flex gap-1 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <Button
                key={value}
                type="button"
                variant={(formData[field.id] as number) === value ? 'default' : 'outline'}
                size="sm"
                className="w-8 h-8"
                onClick={() => handleFieldChange(field.id, value)}
              >
                {value}
              </Button>
            ))}
          </div>
        );

      case 'heading':
        return (
          <h3 className="text-lg font-semibold text-foreground pt-2">{field.label}</h3>
        );

      case 'paragraph':
        return (
          <p className="text-muted-foreground text-sm">{field.description || field.label}</p>
        );

      case 'divider':
        return <hr className="border-t border-border/50" />;

      case 'image':
        return field.placeholder ? (
          <img src={field.placeholder} alt={field.label} className="max-w-full rounded-lg" />
        ) : null;

      case 'address':
        return (
          <div className="space-y-2">
            <Input
              placeholder="Street Address"
              value={((formData[field.id] as Record<string, string>) || {}).street || ''}
              onChange={(e) => handleFieldChange(field.id, { 
                ...((formData[field.id] as Record<string, string>) || {}), 
                street: e.target.value 
              })}
              className={`h-11 transition-all hover:border-primary/50 ${hasError ? 'border-destructive' : ''}`}
            />
            <div className="grid grid-cols-2 gap-2">
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
            <div className="grid grid-cols-2 gap-2">
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
      <div className="p-4">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-20 w-full mb-4" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold">Form not found</h2>
        <p className="text-muted-foreground text-sm">This form may have been removed or the link is incorrect.</p>
      </div>
    );
  }

  if (!form.is_accepting_responses) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold">Form Closed</h2>
        <p className="text-muted-foreground text-sm">This form is no longer accepting responses.</p>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
        <p className="text-muted-foreground">{form.confirmation_message || 'Your response has been submitted.'}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Helmet>
        <title>{form.title}</title>
      </Helmet>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h1 className="text-xl font-bold">{form.title}</h1>
          {form.description && (
            <p className="text-muted-foreground text-sm mt-1">{form.description}</p>
          )}
        </div>

        {duplicateError && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            You have already submitted a response with this email.
          </div>
        )}

        {/* Respondent Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Your Name</Label>
            <Input
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
              placeholder="Optional"
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Your Email</Label>
            <Input
              type="email"
              value={respondentEmail}
              onChange={(e) => setRespondentEmail(e.target.value)}
              placeholder="Optional"
              className="h-9"
            />
          </div>
        </div>

        {/* Form Fields */}
        {fields?.map((field) => {
          const isLayoutField = ['heading', 'paragraph', 'divider', 'image'].includes(field.field_type);
          
          return (
            <div key={field.id} className="space-y-1">
              {!isLayoutField && (
                <Label className="text-sm">
                  {field.label}
                  {field.is_required && <span className="text-destructive ml-1">*</span>}
                </Label>
              )}
              {renderField(field)}
              {errors[field.id] && (
                <p className="text-xs text-destructive">{errors[field.id]}</p>
              )}
            </div>
          );
        })}

        <Button
          type="submit"
          className="w-full"
          disabled={submitResponse.isPending}
        >
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
    </div>
  );
};

export default EmbedForm;