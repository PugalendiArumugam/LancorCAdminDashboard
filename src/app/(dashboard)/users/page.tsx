"use client";

import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// ---------------------------------------------------------------------------
// Mock API layer - structured like real REST calls to:
// http://localhost:8080/api/admin/users
// ---------------------------------------------------------------------------

const API_BASE = "http://localhost:8080/api/admin/users";

let mockUsers: User[] = [
  {
    society_id: "11111111-1111-1111-1111-111111111111",
    user_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    full_name: "John Admin",
    email: "admin@example.com",
    phone: "+91 98765 43210",
    user_type: "ADMIN",
    is_active: true,
  },
  {
    society_id: "11111111-1111-1111-1111-111111111111",
    user_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    full_name: "Meena Owner",
    email: "meena.owner@example.com",
    phone: "+91 90000 00001",
    user_type: "OWNER",
    is_active: true,
  },
];

async function mockDelay(ms = 400) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchUsers(): Promise<User[]> {
  // In a real app you would:
  // const res = await fetch(API_BASE);
  // return res.json();
  await mockDelay();
  return structuredClone(mockUsers);
}

type CreateUserInput = Omit<User, "user_id">;

async function createUser(data: CreateUserInput): Promise<User> {
  await mockDelay();

  const newUser: User = {
    ...data,
    user_id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
  };

  mockUsers = [newUser, ...mockUsers];
  // Simulate POST to `${API_BASE}`
  void API_BASE;
  return structuredClone(newUser);
}

type UpdateUserInput = Partial<Omit<User, "user_id">> & { user_id: string };

async function updateUser(data: UpdateUserInput): Promise<User> {
  await mockDelay();

  const index = mockUsers.findIndex((u) => u.user_id === data.user_id);
  if (index === -1) {
    throw new Error("User not found");
  }

  mockUsers[index] = {
    ...mockUsers[index],
    ...data,
  };

  // Simulate PUT to `${API_BASE}/${data.user_id}`
  void API_BASE;
  return structuredClone(mockUsers[index]);
}

async function softDeleteUser(user_id: string): Promise<User> {
  await mockDelay();

  const index = mockUsers.findIndex((u) => u.user_id === user_id);
  if (index === -1) {
    throw new Error("User not found");
  }

  mockUsers[index] = {
    ...mockUsers[index],
    is_active: false,
  };

  // Simulate DELETE (soft) to `${API_BASE}/${user_id}`
  void API_BASE;
  return structuredClone(mockUsers[index]);
}

// ---------------------------------------------------------------------------
// Form schema (React Hook Form + Zod)
// ---------------------------------------------------------------------------

const userFormSchema = z.object({
  society_id: z
    .string()
    .uuid("Society ID must be a valid UUID"),
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .min(7, "Phone number is too short")
    .max(20, "Phone number is too long"),
  user_type: z.custom<UserType>(
    (val) =>
      typeof val === "string" &&
      ["ADMIN", "EC", "OWNER", "TENANT", "STAFF", "SECURITY"].includes(val),
    { message: "Select a valid user type" },
  ),
  is_active: z.boolean().default(true),
});

type UserFormValues = z.infer<typeof userFormSchema>;

// ---------------------------------------------------------------------------
// User Form component
// ---------------------------------------------------------------------------

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
    <form
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
      })}
      className="space-y-4"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Society ID
          </label>
          <Input
            placeholder="e.g. 11111111-1111-1111-1111-111111111111"
            {...register("society_id")}
            aria-invalid={!!errors.society_id}
          />
          {errors.society_id && (
            <p className="text-xs text-red-600">
              {errors.society_id.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Full Name
          </label>
          <Input
            placeholder="Enter full name"
            {...register("full_name")}
            aria-invalid={!!errors.full_name}
          />
          {errors.full_name && (
            <p className="text-xs text-red-600">
              {errors.full_name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <Input
            type="email"
            placeholder="name@domain.com"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Phone
          </label>
          <Input
            placeholder="+91 98xxx xxxxx"
            {...register("phone")}
            aria-invalid={!!errors.phone}
          />
          {errors.phone && (
            <p className="text-xs text-red-600">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            User Type
          </label>
          <Select
            defaultValue={initialValues.user_type}
            onValueChange={(value) =>
              setValue("user_type", value as UserType, {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger
              className="w-full"
              aria-invalid={!!errors.user_type}
            >
              <SelectValue placeholder="Select user type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="EC">EC</SelectItem>
              <SelectItem value="OWNER">Owner</SelectItem>
              <SelectItem value="TENANT">Tenant</SelectItem>
              <SelectItem value="STAFF">Staff</SelectItem>
              <SelectItem value="SECURITY">Security</SelectItem>
            </SelectContent>
          </Select>
          {errors.user_type && (
            <p className="text-xs text-red-600">
              {errors.user_type.message as string}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-6">
          <Switch
            checked={isActive}
            onCheckedChange={(checked) =>
              setValue("is_active", checked, { shouldValidate: true })
            }
          />
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-slate-700">Active</p>
            <p className="text-xs text-slate-500">
              {isActive
                ? "User will be able to access the portal."
                : "User will be soft-deleted and deactivated."}
            </p>
          </div>
        </div>
      </div>

      <DialogFooter className="pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
            ? "Create User"
            : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main Users Page
// ---------------------------------------------------------------------------

export default function UsersPage() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<UserType | "ALL">("ALL");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogUser, setEditDialogUser] = useState<User | null>(null);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const createMutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      createUser({
        ...values,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setCreateDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { user_id: string; values: UserFormValues }) =>
      updateUser({ user_id: payload.user_id, ...payload.values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditDialogUser(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (user_id: string) => softDeleteUser(user_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !term ||
        user.full_name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term);

      const matchesType =
        userTypeFilter === "ALL" || user.user_type === userTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [users, searchTerm, userTypeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-slate-500">
            Manage society users, roles, and access.
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="mt-2 sm:mt-0">
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
            </DialogHeader>
            <UserForm
              mode="create"
              initialValues={{
                society_id: "11111111-1111-1111-1111-111111111111",
                full_name: "",
                email: "",
                phone: "",
                user_type: "OWNER",
                is_active: true,
              }}
              onSubmit={async (values) => {
                await createMutation.mutateAsync(values);
              }}
              onCancel={() => setCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span>Users</span>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative w-full md:w-64">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select
                value={userTypeFilter}
                onValueChange={(value) =>
                  setUserTypeFilter(value as UserType | "ALL")
                }
              >
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="EC">EC</SelectItem>
                  <SelectItem value="OWNER">Owner</SelectItem>
                  <SelectItem value="TENANT">Tenant</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="SECURITY">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="relative">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center">
                      <span className="text-sm text-slate-500">
                        Loading users...
                      </span>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center">
                      <span className="text-sm text-slate-500">
                        No users found. Try adjusting your search or filters.
                      </span>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">
                        {user.full_name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.user_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog
                            open={
                              editDialogUser?.user_id === user.user_id &&
                              !!editDialogUser
                            }
                            onOpenChange={(open) => {
                              if (open) {
                                setEditDialogUser(user);
                              } else {
                                setEditDialogUser(null);
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="xs"
                                variant="outline"
                                className="hidden sm:inline-flex"
                              >
                                <Pencil className="mr-1 h-3.5 w-3.5" />
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit User</DialogTitle>
                              </DialogHeader>

                              {editDialogUser && (
                                <UserForm
                                  mode="edit"
                                  initialValues={{
                                    society_id: editDialogUser.society_id,
                                    full_name: editDialogUser.full_name,
                                    email: editDialogUser.email,
                                    phone: editDialogUser.phone,
                                    user_type: editDialogUser.user_type,
                                    is_active: editDialogUser.is_active,
                                  }}
                                  onSubmit={async (values) => {
                                    await updateMutation.mutateAsync({
                                      user_id: editDialogUser.user_id,
                                      values,
                                    });
                                  }}
                                  onCancel={() => setEditDialogUser(null)}
                                />
                              )}
                            </DialogContent>
                          </Dialog>

                          <Button
                            size="xs"
                            variant="destructive"
                            disabled={
                              deleteMutation.isPending || !user.is_active
                            }
                            onClick={() => deleteMutation.mutate(user.user_id)}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            {user.is_active ? "Delete" : "Deleted"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

