import React, { useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, User, Shield } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { ROLES, PERMISSIONS, Permission, Role } from "@shared/schema";

// Form schema for user role update
const userRoleUpdateSchema = z.object({
  userId: z.number(),
  role: z.string(),
  // May add custom permissions later
});

type UserRoleFormValues = z.infer<typeof userRoleUpdateSchema>;

// User type from the API
interface ApiUser {
  id: number;
  username: string;
  email: string | null;
  role: string;
  customPermissions: string[] | null;
}

export default function AdminUsersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);

  // Role management dialog state
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);

  // Fetch users
  const {
    data: users,
    isLoading,
    error,
  } = useQuery<ApiUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn(),
  });

  // Fetch roles
  const {
    data: roles,
    isLoading: rolesLoading,
  } = useQuery<string[]>({
    queryKey: ["/api/admin/roles"],
    queryFn: getQueryFn(),
  });

  // Fetch permissions
  const {
    data: permissions,
    isLoading: permissionsLoading,
  } = useQuery<string[]>({
    queryKey: ["/api/admin/permissions"],
    queryFn: getQueryFn(),
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (data: UserRoleFormValues) => {
      const res = await apiRequest(
        "PUT",
        `/api/admin/users/${data.userId}/role`,
        { role: data.role }
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Role updated",
        description: "User role has been updated successfully",
      });
      setIsRoleDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Role update form 
  const form = useForm<UserRoleFormValues>({
    resolver: zodResolver(userRoleUpdateSchema),
    defaultValues: {
      userId: -1,
      role: "",
    },
  });

  const onOpenRoleDialog = (user: ApiUser) => {
    setSelectedUser(user);
    form.reset({
      userId: user.id,
      role: user.role,
    });
    setIsRoleDialogOpen(true);
  };

  const onSubmitRoleForm = (values: UserRoleFormValues) => {
    updateRoleMutation.mutate(values);
  };

  // If not admin, redirect to dashboard
  if (!authLoading && user && user.role !== ROLES.ADMIN) {
    return <Redirect to="/" />;
  }

  if (isLoading || authLoading) {
    return (
      <MainLayout title="User Management">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="User Management">
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground">Could not load users. Please try again.</p>
          <Button className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] })}>
            Retry
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="User Management">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage user roles and permissions</p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            Admin Area
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
            <CardDescription>Manage user roles and access control</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.role === ROLES.ADMIN ? "default" : 
                                 user.role === ROLES.MANAGER ? "outline" : "secondary"}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1"
                          onClick={() => onOpenRoleDialog(user)}
                          disabled={user.id === user?.id} // Prevent changing own role
                        >
                          <Shield className="h-4 w-4" />
                          Manage Role
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Role Management Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User Role</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="mb-4">
              <p>
                <span className="font-semibold">Username:</span> {selectedUser.username}
              </p>
              <p>
                <span className="font-semibold">Current Role:</span>{" "}
                <Badge variant="outline">{selectedUser.role}</Badge>
              </p>
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitRoleForm)} className="space-y-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      disabled={updateRoleMutation.isPending || rolesLoading}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles && roles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsRoleDialogOpen(false)}
                  disabled={updateRoleMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateRoleMutation.isPending}
                >
                  {updateRoleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}