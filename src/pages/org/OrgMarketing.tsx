import React from 'react';
import { Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { MarketingAnalyticsDashboard } from '@/components/org/MarketingAnalyticsDashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Megaphone } from 'lucide-react';

const OrgMarketing = () => {
  return (
    <OrganizationLayout>
      <div className="space-y-6 w-full max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to="/org/dashboard">
                <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2 gap-1 text-xs">
                  <ArrowLeft className="h-3 w-3" />
                  Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <Megaphone className="h-5 w-5 sm:h-6 sm:w-6" />
              Marketing Analytics
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
              Social media performance across all your contests and events
            </p>
          </div>
        </div>

        <MarketingAnalyticsDashboard />
      </div>
    </OrganizationLayout>
  );
};

export default OrgMarketing;
