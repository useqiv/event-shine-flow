import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { useAllUsers, useSuspendUser, useActivateUser } from '@/hooks/useAdminData';
import { useBulkSuspendUsers, useBulkActivateUsers, useLogAdminActivity } from '@/hooks/useAdminActivityLog';
import { Search, MoreHorizontal, UserX, UserCheck, Eye, AlertTriangle, Pencil, CheckSquare, Gift } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import EditUserDialog from '@/components/admin/EditUserDialog';
import RewardReferralDialog from '@/components/admin/RewardReferralDialog';

const AdminUsers: React.FC = () => {
  const { data: users, isLoading } = useAllUsers();
  const suspendUser = useSuspendUser();
  const activateUser = useActivateUser();
  const bulkSuspend = useBulkSuspendUsers();
  const bulkActivate = useBulkActivateUsers();
  const logActivity = useLogAdminActivity();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkSuspendDialogOpen, setBulkSuspendDialogOpen] = useState(false);
  const [bulkSuspendReason, setBulkSuspendReason] = useState('');

  const filteredUsers = users?.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleSuspend = async () => {
    if (!selectedUser || !suspendReason) return;
    await suspendUser.mutateAsync({ userId: selectedUser.id, reason: suspendReason });
    await logActivity.mutateAsync({
      actionType: 'suspend_user',
      entityType: 'user',
      entityId: selectedUser.id,
      description: `Suspended user ${selectedUser.full_name || selectedUser.email}`,
      metadata: { reason: suspendReason }
    });
    setSuspendDialogOpen(false);
    setSuspendReason('');
    setSelectedUser(null);
  };

  const handleActivate = async (user: any) => {
    await activateUser.mutateAsync(user.id);
    await logActivity.mutateAsync({
      actionType: 'activate_user',
      entityType: 'user',
      entityId: user.id,
      description: `Activated user ${user.full_name || user.email}`
    });
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleBulkSuspend = async () => {
    if (!bulkSuspendReason) return;
    await bulkSuspend.mutateAsync({ 
      userIds: Array.from(selectedUsers), 
      reason: bulkSuspendReason 
    });
    setSelectedUsers(new Set());
    setBulkSuspendDialogOpen(false);
    setBulkSuspendReason('');
  };

  const handleBulkActivate = async () => {
    await bulkActivate.mutateAsync(Array.from(selectedUsers));
    setSelectedUsers(new Set());
  };

  const selectedActiveUsers = users?.filter(u => selectedUsers.has(u.id) && !u.is_suspended) || [];
  const selectedSuspendedUsers = users?.filter(u => selectedUsers.has(u.id) && u.is_suspended) || [];

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      admin: 'destructive',
      organization: 'default',
      user: 'secondary'
    };
    return <Badge variant={variants[role] || 'secondary'}>{role}</Badge>;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage all platform users</p>
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
          <h1 className="text-xl sm:text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage all platform users</p>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold">{users?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold">
                {users?.filter(u => u.role === 'user').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Regular Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold">
                {users?.filter(u => u.role === 'organization').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Organizations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-destructive">
                {users?.filter(u => u.is_suspended).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Suspended</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">All Users</CardTitle>
                <CardDescription>View and manage user accounts</CardDescription>
              </div>
              {selectedUsers.size > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedActiveUsers.length > 0 && (
                    <Button 
                      size="sm"
                      variant="destructive"
                      onClick={() => setBulkSuspendDialogOpen(true)}
                    >
                      <UserX className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Suspend</span> {selectedActiveUsers.length}
                    </Button>
                  )}
                  {selectedSuspendedUsers.length > 0 && (
                    <Button 
                      size="sm"
                      className="bg-green-500 hover:bg-green-600"
                      onClick={handleBulkActivate}
                      disabled={bulkActivate.isPending}
                    >
                      <UserCheck className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Activate</span> {selectedSuspendedUsers.length}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Fraud Score</TableHead>
                    <TableHead className="hidden sm:table-cell">Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                            <AvatarImage src={user.avatar_url || ''} />
                            <AvatarFallback>
                              {user.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm truncate max-w-[100px] sm:max-w-none">{user.full_name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="truncate max-w-[150px] block">{user.email}</span>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {user.is_suspended ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={user.fraud_score > 50 ? 'destructive' : user.fraud_score > 25 ? 'secondary' : 'outline'}>
                          {user.fraud_score}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{format(new Date(user.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setViewDialogOpen(true);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setEditDialogOpen(true);
                            }}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setRewardDialogOpen(true);
                            }}>
                              <Gift className="mr-2 h-4 w-4" />
                              Reward Referral
                            </DropdownMenuItem>
                            {user.is_suspended ? (
                              <DropdownMenuItem onClick={() => handleActivate(user)}>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSuspendDialogOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Suspend User
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

        {/* Suspend Dialog */}
        <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspend User</DialogTitle>
              <DialogDescription>
                This will prevent the user from accessing the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedUser?.avatar_url || ''} />
                  <AvatarFallback>{selectedUser?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Suspension Reason</label>
                <Textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Enter reason for suspension..."
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleSuspend}
                disabled={!suspendReason || suspendUser.isPending}
              >
                Suspend User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Suspend Dialog */}
        <Dialog open={bulkSuspendDialogOpen} onOpenChange={setBulkSuspendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Suspend Users</DialogTitle>
              <DialogDescription>
                You are about to suspend {selectedActiveUsers.length} users.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="max-h-32 overflow-y-auto space-y-2">
                {selectedActiveUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-2 text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <span>{user.full_name || user.email}</span>
                  </div>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium">Suspension Reason (for all)</label>
                <Textarea
                  value={bulkSuspendReason}
                  onChange={(e) => setBulkSuspendReason(e.target.value)}
                  placeholder="Enter reason for suspension..."
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkSuspendDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleBulkSuspend}
                disabled={!bulkSuspendReason || bulkSuspend.isPending}
              >
                Suspend All
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedUser.avatar_url || ''} />
                    <AvatarFallback className="text-lg">
                      {selectedUser.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedUser.full_name}</h3>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                    <div className="flex gap-2 mt-2">
                      {getRoleBadge(selectedUser.role)}
                      {selectedUser.is_suspended ? (
                        <Badge variant="destructive">Suspended</Badge>
                      ) : (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fraud Score</p>
                    <p className="font-medium">{selectedUser.fraud_score}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account Created</p>
                    <p className="font-medium">{format(new Date(selectedUser.created_at), 'PPP')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{format(new Date(selectedUser.updated_at), 'PPP')}</p>
                  </div>
                </div>

                {/* Wallet Balances */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    💰 Wallet Balances
                  </h4>
                  {selectedUser.currency_balances && selectedUser.currency_balances.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedUser.currency_balances.map((cb: { currency: string; balance: number }, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-background rounded border">
                          <span className="text-sm font-medium">{cb.currency}</span>
                          <span className="text-sm font-bold">{cb.balance.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No wallet balances</p>
                  )}
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Legacy Balance</span>
                      <span className="text-sm font-medium">{Number(selectedUser.wallet_balance || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {selectedUser.is_suspended && (
                  <div className="p-4 bg-destructive/10 rounded-lg">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Suspended</span>
                    </div>
                    <p className="text-sm mt-2">
                      <strong>Reason:</strong> {selectedUser.suspended_reason}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Suspended on: {selectedUser.suspended_at ? format(new Date(selectedUser.suspended_at), 'PPP') : 'Unknown'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <EditUserDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          user={selectedUser}
        />

        {/* Reward Referral Dialog */}
        <RewardReferralDialog
          open={rewardDialogOpen}
          onOpenChange={setRewardDialogOpen}
          user={selectedUser}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
