-- Create event_templates table for recurring event templates
CREATE TABLE public.event_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_templates
CREATE POLICY "Organizations can manage their own templates"
ON public.event_templates
FOR ALL
USING (auth.uid() = organization_id);

-- Create webhooks table for organization webhooks
CREATE TABLE public.organization_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  failure_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhooks
CREATE POLICY "Organizations can manage their own webhooks"
ON public.organization_webhooks
FOR ALL
USING (auth.uid() = organization_id);

-- Create webhook_logs table to track webhook deliveries
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES organization_webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook_logs
CREATE POLICY "Organizations can view their webhook logs"
ON public.webhook_logs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM organization_webhooks
  WHERE organization_webhooks.id = webhook_logs.webhook_id
  AND organization_webhooks.organization_id = auth.uid()
));

-- Triggers for updated_at
CREATE TRIGGER update_event_templates_updated_at
BEFORE UPDATE ON public.event_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_webhooks_updated_at
BEFORE UPDATE ON public.organization_webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();