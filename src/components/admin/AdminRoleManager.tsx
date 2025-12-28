import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Users, UserPlus, Shield, ShieldCheck, User, Trash2, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserWithRole {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: "admin" | "moderator" | "organization" | "user";
}

const roleOptions = [
  { value: "admin", label: "Admin", icon: ShieldCheck, description: "Full system access" },
  { value: "moderator", label: "Moderator", icon: Shield, description: "Content moderation" },
  { value: "organization", label: "Organization", icon: Users, description: "Manage own contests/events" },
  { value: "user", label: "User", icon: User, description: "Standard user access" }
];

export function AdminRoleManager() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("moderator");
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserWithRole | null>(null);

  // Fetch all users with their roles
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-role-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

      return profiles?.map(profile => ({
        ...profile,
        role: roleMap.get(profile.id) || "user"
      })) as UserWithRole[];
    }
  });

  // Filter to show admins and moderators first
  const adminUsers = users?.filter(u => u.role === "admin" || u.role === "moderator") || [];
  const filteredUsers = users?.filter(u => {
    const matchesSearch = !searchQuery || 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) || [];

  const assignRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "moderator" | "organization" | "user" }) => {
      // First check if user already has a role entry
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-role-users"] });
      toast.success("Role updated successfully");
      setIsAssignDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error("Failed to update role: " + error.message);
    }
  });

  const removeAdminRole = useMutation({
    mutationFn: async (userId: string) => {
      // Change role back to user
      const { error } = await supabase
        .from("user_roles")
        .update({ role: "user" })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-role-users"] });
      toast.success("Admin role removed");
      setDeleteConfirmUser(null);
    },
    onError: (error) => {
      toast.error("Failed to remove role: " + error.message);
    }
  });

  const handleAssignRole = (user: UserWithRole) => {
    setSelectedUser(user);
    setSelectedRole(user.role === "user" ? "moderator" : user.role);
    setIsAssignDialogOpen(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Admin</Badge>;
      case "moderator":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Moderator</Badge>;
      case "organization":
        return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Organization</Badge>;
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Admin Role Management
            </CardTitle>
            <CardDescription>Manage admin and moderator access</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{adminUsers.length} Admin/Moderators</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Admins/Moderators */}
        {adminUsers.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Current Admins & Moderators</h4>
            <div className="grid gap-2">
              {adminUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{user.full_name?.[0] || user.email?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{user.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(user.role)}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setDeleteConfirmUser(user)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Users */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Assign Roles to Users</h4>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No users found matching your search" : "No users found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.slice(0, 10).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>{user.full_name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.full_name || "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleAssignRole(user)}>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Change Role
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredUsers.length > 10 && (
          <p className="text-sm text-muted-foreground text-center">
            Showing 10 of {filteredUsers.length} users. Use search to find specific users.
          </p>
        )}

        {/* Assign Role Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>
                Assign a new role to {selectedUser?.full_name || selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Avatar>
                  <AvatarImage src={selectedUser?.avatar_url || undefined} />
                  <AvatarFallback>{selectedUser?.full_name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser?.full_name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          <role.icon className="h-4 w-4" />
                          <div>
                            <span className="font-medium">{role.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">{role.description}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRole === "admin" && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive font-medium">⚠️ Warning</p>
                  <p className="text-xs text-destructive/80">
                    Admin role grants full system access including user management, financial data, and system settings.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => selectedUser && assignRole.mutate({ userId: selectedUser.id, role: selectedRole as "admin" | "moderator" | "organization" | "user" })}
                disabled={assignRole.isPending}
              >
                {assignRole.isPending ? "Updating..." : "Update Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirmUser} onOpenChange={() => setDeleteConfirmUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Admin Access?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove admin/moderator privileges from {deleteConfirmUser?.full_name || deleteConfirmUser?.email} and change their role to a regular user.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirmUser && removeAdminRole.mutate(deleteConfirmUser.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove Access
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
