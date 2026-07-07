import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationSettings } from '@/hooks/useOrganization';
import { useOrgOnboardingProgress } from '@/hooks/useOrgOnboardingProgress';
import {
  CheckCircle2,
  Circle,
  Rocket,
  X,
  ArrowRight,
  PartyPopper,
} from 'lucide-react';

const dismissKey = (userId: string) => `org-onboarding-dismissed-${userId}`;

const OrgOnboardingChecklist = () => {
  const { user } = useAuth();
  const { data: orgSettings } = useOrganizationSettings();

  const { steps, completedCount, totalCount, progressPercent, isComplete } =
    useOrgOnboardingProgress({ orgSettings });

  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setDismissed(localStorage.getItem(dismissKey(user.id)) === 'true');
  }, [user?.id]);

  const handleDismiss = () => {
    if (!user?.id) return;
    localStorage.setItem(dismissKey(user.id), 'true');
    setDismissed(true);
  };

  if (dismissed || isComplete) {
    if (isComplete && !dismissed) {
      return (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="py-4 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <PartyPopper className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    You&apos;re all set!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your organization setup is complete. Focus on growing your audience.
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleDismiss} className="shrink-0">
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Rocket className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
              Getting Started
            </CardTitle>
            <CardDescription>
              {completedCount} of {totalCount} steps complete — finish setup to unlock your full
              potential
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleDismiss}
            aria-label="Dismiss checklist"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Progress value={progressPercent} className="h-2 mt-3" />
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pt-0">
        <div className="space-y-2">
          {steps.map((step) => (
            <Link key={step.id} to={step.href} className="block">
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  step.completed
                    ? 'border-green-500/20 bg-green-500/5'
                    : 'border-border hover:bg-secondary/50'
                }`}
              >
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`text-sm font-medium ${step.completed ? 'text-muted-foreground line-through' : ''}`}
                    >
                      {step.title}
                    </p>
                    {step.completed && (
                      <Badge variant="outline" className="text-[10px] text-green-600 border-green-500/30">
                        Done
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                </div>
                {!step.completed && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrgOnboardingChecklist;
