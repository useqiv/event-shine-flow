import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  useAllOrganizations, 
  useApproveOrganization, 
  useRejectOrganization 
} from '@/hooks/useAdminData';
import { 
  Search, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Eye,
  Building2,
  Ban
} from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const AdminOrganizations: React.FC = () => {
  const { data: organizations, isLoading } = useAllOrganizations();
  const approveOrg = useApproveOrganization();
  const rejectOrg = useRejectOrganization();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [specialRate, setSpecialRate] = useState('');

  const filteredOrgs = organizations?.filter(org => 
    org.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleApprove = async () => {
    if (!selectedOrg) return;
    await approveOrg.mutateAsync({ 
      orgId: selectedOrg.id, 
      specialRate: specialRate ? parseFloat(specialRate) : undefined 
    });
    setApproveDialogOpen(false);
    setSpecialRate('');
    setSelectedOrg(null);
  };

  const handleReject = async () => {
    if (!selectedOrg || !rejectReason) return;
    await rejectOrg.mutateAsync({ orgId: selectedOrg.id, reason: rejectReason });
    setRejectDialogOpen(false);
    setRejectReason('');
    setSelectedOrg(null);
  };

  const getStatusBadge = (org: any) => {
    if (org.approval?.is_blacklisted) {
      return <Badge variant="destructive">Blacklisted</Badge>;
    }
    switch (org.approval?.status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Organization Management</h1>
            <p className="text-muted-foreground">Manage company accounts</p>
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Organization Management</h1>
          <p className="text-muted-foreground">Manage company accounts</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{organizations?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Total Organizations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-500">
                {organizations?.filter(o => o.approval?.status === 'approved').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-500">
                {organizations?.filter(o => !o.approval || o.approval?.status === 'pending').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-destructive">
                {organizations?.filter(o => o.approval?.is_blacklisted).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Blacklisted</p>
            </CardContent>
          </Card>
        </div>

        {/* Organizations Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Organizations</CardTitle>
            <CardDescription>View and manage organization accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Commission Rate</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgs.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={org.avatar_url || ''} />
                            <AvatarFallback>
                              <Building2 className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{org.full_name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{org.email}</TableCell>
                      <TableCell>{getStatusBadge(org)}</TableCell>
                      <TableCell>
                        {org.approval?.special_commission_rate 
                          ? `${org.approval.special_commission_rate}%`
                          : 'Default (10%)'}
                      </TableCell>
                      <TableCell>{format(new Date(org.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedOrg(org);
                              setViewDialogOpen(true);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {(!org.approval || org.approval?.status === 'pending') && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedOrg(org);
                                    setApproveDialogOpen(true);
                                  }}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedOrg(org);
                                    setRejectDialogOpen(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {org.approval?.status === 'approved' && !org.approval?.is_blacklisted && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedOrg(org);
                                  setRejectDialogOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Blacklist
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Approve Dialog */}
        <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Organization</DialogTitle>
              <DialogDescription>
                Approve this organization to create contests and events.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedOrg?.avatar_url || ''} />
                  <AvatarFallback><Building2 className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedOrg?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrg?.email}</p>
                </div>
              </div>
              <div>
                <Label>Special Commission Rate (optional)</Label>
                <Input
                  type="number"
                  value={specialRate}
                  onChange={(e) => setSpecialRate(e.target.value)}
                  placeholder="Leave empty for default rate (10%)"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter a custom commission rate for this organization
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-green-500 hover:bg-green-600"
                onClick={handleApprove}
                disabled={approveOrg.isPending}
              >
                Approve Organization
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Organization</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting this organization.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedOrg?.avatar_url || ''} />
                  <AvatarFallback><Building2 className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedOrg?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrg?.email}</p>
                </div>
              </div>
              <div>
                <Label>Rejection Reason</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectReason || rejectOrg.isPending}
              >
                Reject Organization
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Organization Details</DialogTitle>
            </DialogHeader>
            {selectedOrg && (
              <div className="space-y-6 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedOrg.avatar_url || ''} />
                    <AvatarFallback className="text-lg">
                      <Building2 className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedOrg.full_name}</h3>
                    <p className="text-muted-foreground">{selectedOrg.email}</p>
                    <div className="mt-2">{getStatusBadge(selectedOrg)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedOrg.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Commission Rate</p>
                    <p className="font-medium">
                      {selectedOrg.approval?.special_commission_rate 
                        ? `${selectedOrg.approval.special_commission_rate}%`
                        : 'Default (10%)'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">{format(new Date(selectedOrg.created_at), 'PPP')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Approval Date</p>
                    <p className="font-medium">
                      {selectedOrg.approval?.reviewed_at 
                        ? format(new Date(selectedOrg.approval.reviewed_at), 'PPP')
                        : 'Not reviewed'}
                    </p>
                  </div>
                </div>

                {selectedOrg.settings && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Company Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Company Name</p>
                        <p className="font-medium">{selectedOrg.settings.company_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Company Email</p>
                        <p className="font-medium">{selectedOrg.settings.company_email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Company Phone</p>
                        <p className="font-medium">{selectedOrg.settings.company_phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payout Method</p>
                        <p className="font-medium capitalize">{selectedOrg.settings.preferred_payout_method || 'Bank'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedOrg.approval?.rejection_reason && (
                  <div className="p-4 bg-destructive/10 rounded-lg">
                    <p className="text-sm font-medium text-destructive">Rejection Reason</p>
                    <p className="text-sm mt-1">{selectedOrg.approval.rejection_reason}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminOrganizations;