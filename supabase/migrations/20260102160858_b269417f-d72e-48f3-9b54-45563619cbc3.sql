-- Add scheduling, multi-page, and payment columns to forms table
ALTER TABLE public.forms 
ADD COLUMN IF NOT EXISTS start_date timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS end_date timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS total_pages integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS requires_payment boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_currency text DEFAULT 'NGN';

-- Add page_number and conditional logic to form_fields
ALTER TABLE public.form_fields
ADD COLUMN IF NOT EXISTS page_number integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS conditional_logic jsonb DEFAULT NULL;

-- Add payment_status and payment_reference to form_responses
ALTER TABLE public.form_responses
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_reference text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_amount numeric DEFAULT NULL;

-- Create form_templates table
CREATE TABLE IF NOT EXISTS public.form_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  template_data jsonb NOT NULL DEFAULT '{}',
  fields_data jsonb NOT NULL DEFAULT '[]',
  is_public boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on form_templates
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for form_templates
CREATE POLICY "Anyone can view public templates"
ON public.form_templates
FOR SELECT
USING (is_public = true);

CREATE POLICY "Admins can manage all templates"
ON public.form_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own templates"
ON public.form_templates
FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own templates"
ON public.form_templates
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Insert default templates
INSERT INTO public.form_templates (name, description, category, template_data, fields_data, is_public, created_by)
VALUES 
(
  'Contact Form',
  'Simple contact form with name, email, and message fields',
  'contact',
  '{"title": "Contact Us", "description": "We''d love to hear from you! Please fill out the form below.", "confirmation_message": "Thank you for reaching out! We will get back to you soon."}',
  '[{"field_type": "first_name", "label": "First Name", "is_required": true, "page_number": 1, "display_order": 1}, {"field_type": "last_name", "label": "Last Name", "is_required": true, "page_number": 1, "display_order": 2}, {"field_type": "email", "label": "Email Address", "is_required": true, "page_number": 1, "display_order": 3}, {"field_type": "phone", "label": "Phone Number", "is_required": false, "page_number": 1, "display_order": 4}, {"field_type": "textarea", "label": "Your Message", "is_required": true, "page_number": 1, "display_order": 5, "placeholder": "How can we help you?"}]',
  true,
  NULL
),
(
  'Feedback Form',
  'Collect customer feedback with ratings and comments',
  'feedback',
  '{"title": "Share Your Feedback", "description": "Your feedback helps us improve. Please take a moment to share your thoughts.", "confirmation_message": "Thank you for your valuable feedback!"}',
  '[{"field_type": "first_name", "label": "First Name", "is_required": false, "page_number": 1, "display_order": 1}, {"field_type": "email", "label": "Email", "is_required": false, "page_number": 1, "display_order": 2}, {"field_type": "rating", "label": "Overall Satisfaction", "is_required": true, "page_number": 1, "display_order": 3, "description": "Rate your experience from 1 to 5"}, {"field_type": "radio", "label": "Would you recommend us?", "is_required": true, "page_number": 1, "display_order": 4, "options": ["Definitely", "Probably", "Not sure", "Probably not", "Definitely not"]}, {"field_type": "textarea", "label": "Additional Comments", "is_required": false, "page_number": 1, "display_order": 5, "placeholder": "Share any additional feedback..."}]',
  true,
  NULL
),
(
  'Event Registration',
  'Multi-page event registration with attendee details',
  'event',
  '{"title": "Event Registration", "description": "Register for our upcoming event. Please provide your details below.", "confirmation_message": "You''re registered! Check your email for event details.", "total_pages": 2}',
  '[{"field_type": "heading", "label": "Personal Information", "page_number": 1, "display_order": 1}, {"field_type": "first_name", "label": "First Name", "is_required": true, "page_number": 1, "display_order": 2}, {"field_type": "last_name", "label": "Last Name", "is_required": true, "page_number": 1, "display_order": 3}, {"field_type": "email", "label": "Email Address", "is_required": true, "page_number": 1, "display_order": 4}, {"field_type": "phone", "label": "Phone Number", "is_required": true, "page_number": 1, "display_order": 5}, {"field_type": "heading", "label": "Event Preferences", "page_number": 2, "display_order": 6}, {"field_type": "dropdown", "label": "Session Preference", "is_required": true, "page_number": 2, "display_order": 7, "options": ["Morning Session", "Afternoon Session", "Full Day"]}, {"field_type": "checkbox", "label": "Dietary Requirements", "is_required": false, "page_number": 2, "display_order": 8, "options": ["Vegetarian", "Vegan", "Gluten-free", "Halal", "Kosher", "No restrictions"]}, {"field_type": "textarea", "label": "Special Requests", "is_required": false, "page_number": 2, "display_order": 9, "placeholder": "Any accessibility needs or special requests?"}]',
  true,
  NULL
),
(
  'Customer Survey',
  'Comprehensive survey with multiple question types',
  'survey',
  '{"title": "Customer Satisfaction Survey", "description": "Help us serve you better by completing this short survey.", "confirmation_message": "Thank you for completing our survey!"}',
  '[{"field_type": "radio", "label": "How often do you use our service?", "is_required": true, "page_number": 1, "display_order": 1, "options": ["Daily", "Weekly", "Monthly", "Rarely", "First time"]}, {"field_type": "scale", "label": "How likely are you to recommend us?", "is_required": true, "page_number": 1, "display_order": 2, "description": "On a scale of 1-10"}, {"field_type": "checkbox", "label": "What features do you use most?", "is_required": false, "page_number": 1, "display_order": 3, "options": ["Feature A", "Feature B", "Feature C", "Feature D"]}, {"field_type": "rating", "label": "Rate our customer support", "is_required": true, "page_number": 1, "display_order": 4}, {"field_type": "textarea", "label": "What could we improve?", "is_required": false, "page_number": 1, "display_order": 5, "placeholder": "Share your suggestions..."}]',
  true,
  NULL
),
(
  'Job Application',
  'Multi-page job application form',
  'event',
  '{"title": "Job Application", "description": "Apply for a position at our company.", "confirmation_message": "Thank you for your application! We will review it and get back to you.", "total_pages": 2}',
  '[{"field_type": "heading", "label": "Personal Details", "page_number": 1, "display_order": 1}, {"field_type": "first_name", "label": "First Name", "is_required": true, "page_number": 1, "display_order": 2}, {"field_type": "last_name", "label": "Last Name", "is_required": true, "page_number": 1, "display_order": 3}, {"field_type": "email", "label": "Email", "is_required": true, "page_number": 1, "display_order": 4}, {"field_type": "phone", "label": "Phone", "is_required": true, "page_number": 1, "display_order": 5}, {"field_type": "heading", "label": "Experience & Documents", "page_number": 2, "display_order": 6}, {"field_type": "dropdown", "label": "Years of Experience", "is_required": true, "page_number": 2, "display_order": 7, "options": ["0-1 years", "1-3 years", "3-5 years", "5+ years"]}, {"field_type": "file", "label": "Resume/CV", "is_required": true, "page_number": 2, "display_order": 8}, {"field_type": "textarea", "label": "Cover Letter", "is_required": false, "page_number": 2, "display_order": 9, "placeholder": "Tell us why you would be a great fit..."}]',
  true,
  NULL
),
(
  'Poll / Quick Vote',
  'Simple single-question poll',
  'survey',
  '{"title": "Quick Poll", "description": "Share your opinion!", "confirmation_message": "Thanks for voting!"}',
  '[{"field_type": "radio", "label": "What is your preference?", "is_required": true, "page_number": 1, "display_order": 1, "options": ["Option A", "Option B", "Option C", "Other"]}]',
  true,
  NULL
)
ON CONFLICT DO NOTHING;