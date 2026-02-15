"use client";

import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

type UserType = "ADMIN" | "EC" | "OWNER" | "TENANT" | "STAFF" | "SECURITY";

type User = {
  society_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  user_type: UserType;
  is_active: boolean;
};

const API_BASE = "http://localhost:8080/api/admin/users";

// Senior Dev Fix: Ensure we check both session and local storage for the token
const getHeaders = () => {
  const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * API function with enhanced logging
 */
async function fetchUsers(societyId: string): Promise<User[]> {
  console.log(`[API] Fetching users for Society ID: ${societyId}`);
  
  const res = await fetch(`${API_BASE}?societyId=${societyId}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[API] Server Error: ${res.status}`, err);
    throw new Error("Failed to fetch users");
  }

  const data = await res.json();
  console.log("[API] Raw Data received:", data);
  
  // Logic Fix: Ensure data is an array
  return Array.isArray(data) ? data : (data.users || []); 
}

async function createUser(data: Omit<User, "user_id">): Promise<User> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create user");
  return res.json();
}

async function updateUser(user_id: string, data: Partial<User>): Promise<User> {
  const res = await fetch(`${API_BASE}/${user_id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update user");
  return res.json();
}

async function toggleUserStatus(user_id: string, active: boolean): Promise<void> {
  const res = await fetch(`${API_BASE}/${user_id}/status?active=${active}`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Failed to update user status");
}

const userFormSchema = z.object({
  society_id: z.string().uuid("Society ID must be a valid UUID"),
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(7, "Phone number is too short").max(20, "Phone number is too long"),
  user_type: z.custom<UserType>(
    (val) => typeof val === "string" && ["ADMIN", "EC", "OWNER", "TENANT", "STAFF", "SECURITY"].includes(val),
    { message: "Select a valid user type" },
  ),
  is_active: z.boolean().default(true),
});

type UserFormValues = z.infer<typeof userFormSchema>;

type UserFormProps = {
  mode: "create" | "edit";
  initialValues: UserFormValues;
  onSubmit: (values: UserFormValues) => Promise<void>;
  onCancel?: () => void;
};

function UserForm({ mode, initialValues, onSubmit, onCancel }: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: initialValues,
  });

  const isActive = watch("is_active");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Society ID</label>
          <Input placeholder="Society UUID" {...register("society_id")} disabled />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Full Name</label>
          <Input placeholder="Enter full name" {...register("full_name")} />
          {errors.full_name && <p className="text-xs text-red-600">{errors.full_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <Input type="email" placeholder="name@domain.com" {...register("email")} />
          {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Phone</label>
          <Input placeholder="Phone number" {...register("phone")} />
          {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">User Type</label>
          <Select
            defaultValue={initialValues.user_type}
            onValueChange={(v) => setValue("user_type", v as UserType, { shouldValidate: true })}
          >
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {["ADMIN", "EC", "OWNER", "TENANT", "STAFF", "SECURITY"].map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Switch checked={isActive} onCheckedChange={(c) => setValue("is_active", c)} />
          <span className="text-sm font-medium">Active</span>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {mode === "create" ? "Create User" : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function UsersPage() {
  const { user, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<UserType | "ALL">("ALL");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogUser, setEditDialogUser] = useState<User | null>(null);

  // Monitor auth state changes
  React.useEffect(() => {
    console.log("[UsersPage] Auth State:", { isAuthenticated, isAdmin, societyId: user?.society_id });
  }, [isAuthenticated, isAdmin, user]);

  const { data: users = [], isLoading: dataLoading, error: queryError } = useQuery<User[]>({
    queryKey: ["users", user?.society_id],
    queryFn: async () => {
      console.log("[UsersPage] fetchUsers called with society_id:", user?.society_id);
      return fetchUsers(user?.society_id || "");
    },
    enabled: !!user?.society_id && isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setCreateDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; values: UserFormValues }) => updateUser(payload.id, payload.values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditDialogUser(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => toggleUserStatus(id, false),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Fix: Handle potential undefined fields from backend
      const name = u.full_name || (u as any).fullName || "";
      const email = u.email || "";
      const matchesSearch = !searchTerm || 
        name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = userTypeFilter === "ALL" || u.user_type === userTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [users, searchTerm, userTypeFilter]);

  if (authLoading) return <div className="p-8 text-center">Verifying credentials...</div>;
  if (!isAuthenticated || !isAdmin) return <div className="p-8 text-center text-red-500">Access Denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-slate-500">Managing {users.length} members for Society ID: {user?.society_id}</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Create User</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
            <UserForm
              mode="create"
              initialValues={{ 
                society_id: user?.society_id || "", 
                full_name: "", 
                email: "", 
                phone: "", 
                user_type: "OWNER", 
                is_active: true 
              }}
              onSubmit={async (v) => { await createMutation.mutateAsync(v); }}
              onCancel={() => setCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {queryError && (
        <div className="bg-red-50 p-4 rounded-md text-red-700 text-sm">
          Error loading users. Please check the console and ensure the backend is running.
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex gap-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search users..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Select value={userTypeFilter} onValueChange={(v) => setUserTypeFilter(v as any)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="OWNER">Owner</SelectItem>
                <SelectItem value="TENANT">Tenant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center">Loading users from database...</TableCell></TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-400">No users found for this society.</TableCell></TableRow>
              ) : filteredUsers.map(u => (
                <TableRow key={u.user_id}>
                  <TableCell className="font-medium">{u.full_name || (u as any).fullName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell><Badge variant="outline">{u.user_type}</Badge></TableCell>
                  <TableCell>
                    <Badge className={u.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {u.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditDialogUser(u)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(u.user_id)} disabled={!u.is_active}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editDialogUser} onOpenChange={() => setEditDialogUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          {editDialogUser && (
            <UserForm
              mode="edit"
              initialValues={{ 
                ...editDialogUser,
                full_name: editDialogUser.full_name || (editDialogUser as any).fullName 
              }}
              onSubmit={async (v) => { await updateMutation.mutateAsync({ id: editDialogUser.user_id, values: v }); }}
              onCancel={() => setEditDialogUser(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}