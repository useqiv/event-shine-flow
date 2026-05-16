import React from 'react';
import { Link } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useOrgPermissions } from '@/hooks/useOrgPermissions';
import {
  canCreateOrgCampaign,
  canEditOrgCampaigns,
  canViewOrgCampaigns,
} from '@/lib/orgRouteAccess';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

type CampaignPermissionMode = 'view' | 'edit' | 'create';

interface CampaignPermissionGateProps {
  mode: CampaignPermissionMode;
  children: React.ReactNode;
  redirectTo?: string;
}

const CampaignPermissionGate: React.FC<CampaignPermissionGateProps> = ({
  mode,
  children,
  redirectTo = '/dashboard',
}) => {
  const { data: role, isLoading: roleLoading } = useUserRole();
  const { data: permissions, isLoading: permsLoading } = useOrgPermissions();

  if (roleLoading || permsLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const isOrganization = role === 'organization';
  const isAdmin = role === 'admin';

  let allowed = false;
  if (isAdmin) {
    allowed = true;
  } else if (mode === 'view') {
    allowed = canViewOrgCampaigns(permissions, isOrganization);
  } else if (mode === 'edit') {
    allowed = canEditOrgCampaigns(permissions, isOrganization);
  } else if (mode === 'create') {
    if (!isOrganization && !permissions?.organizationId) {
      allowed = true;
    } else {
      allowed = canCreateOrgCampaign(permissions, isOrganization);
    }
  }

  if (!allowed) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 text-center">
        <Heart className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access denied</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          You don&apos;t have permission to {mode === 'create' ? 'create' : mode === 'edit' ? 'manage' : 'view'}{' '}
          organization campaigns. Contact your organization owner if you need access.
        </p>
        <Button asChild variant="outline">
          <Link to={redirectTo}>Go back</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

export default CampaignPermissionGate;
