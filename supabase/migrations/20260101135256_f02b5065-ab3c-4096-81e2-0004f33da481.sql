-- Create forms table
CREATE TABLE public.forms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    custom_slug TEXT UNIQUE,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_accepting_responses BOOLEAN NOT NULL DEFAULT true,
    confirmation_message TEXT DEFAULT 'Thank you for your response!',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create form_fields table
CREATE TABLE public.form_fields (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    field_type TEXT NOT NULL, -- text, email, number, textarea, dropdown, checkbox, radio, date, file, rating, multiple_choice_grid
    label TEXT NOT NULL,
    description TEXT,
    placeholder TEXT,
    is_required BOOLEAN NOT NULL DEFAULT false,
    options JSONB, -- For dropdown, radio, checkbox options
    validation_rules JSONB, -- min, max, pattern, etc.
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create form_responses table
CREATE TABLE public.form_responses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    respondent_email TEXT,
    respondent_name TEXT,
    response_data JSONB NOT NULL, -- Stores all field responses as key-value pairs
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- Forms policies
CREATE POLICY "Anyone can view active forms" ON public.forms
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage their own forms" ON public.forms
    FOR ALL USING (auth.uid() = user_id);

-- Form fields policies
CREATE POLICY "Anyone can view fields of active forms" ON public.form_fields
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.forms 
            WHERE forms.id = form_fields.form_id 
            AND forms.is_active = true
        )
    );

CREATE POLICY "Users can manage fields for their forms" ON public.form_fields
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.forms 
            WHERE forms.id = form_fields.form_id 
            AND forms.user_id = auth.uid()
        )
    );

-- Form responses policies
CREATE POLICY "Anyone can submit form responses" ON public.form_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.forms 
            WHERE forms.id = form_responses.form_id 
            AND forms.is_active = true 
            AND forms.is_accepting_responses = true
        )
    );

CREATE POLICY "Form owners can view responses" ON public.form_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.forms 
            WHERE forms.id = form_responses.form_id 
            AND forms.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all forms" ON public.forms
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all form fields" ON public.form_fields
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all form responses" ON public.form_responses
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_forms_user_id ON public.forms(user_id);
CREATE INDEX idx_forms_custom_slug ON public.forms(custom_slug);
CREATE INDEX idx_form_fields_form_id ON public.form_fields(form_id);
CREATE INDEX idx_form_fields_display_order ON public.form_fields(form_id, display_order);
CREATE INDEX idx_form_responses_form_id ON public.form_responses(form_id);

-- Trigger to update updated_at
CREATE TRIGGER update_forms_updated_at
    BEFORE UPDATE ON public.forms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_form_fields_updated_at
    BEFORE UPDATE ON public.form_fields
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();