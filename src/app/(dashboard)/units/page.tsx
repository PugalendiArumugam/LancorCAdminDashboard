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

type UnitStatus = "occupied" | "vacant";

type Unit = {
  society_id: string;
  unit_id: string;
  block_name: string;
  unit_number: string;
  unit_type?: string | null;
  floor_number?: number | null;
  built_up_area?: number | null;
  status: UnitStatus;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
};

const API_BASE = "http://localhost:8080/api/admin/units";

const API_BASE2 = "http://localhost:8080/api/admin/users";

const getHeaders = (): Record<string, string> => {
  const authStr = localStorage.getItem("lancorc_auth");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  
  if (!authStr) {
    console.warn("[Auth] No lancorc_auth found in localStorage");
    return headers;
  }
  
  try {
    const authData = JSON.parse(authStr);
    const token = authData.token;
    if (!token) throw new Error("Token missing in storage");
    
    headers["Authorization"] = `Bearer ${token}`;
  } catch (err) {
    console.error("[Auth] Error parsing auth data:", err);
  }
  
  return headers;
};

async function fetchUnits(societyId: string): Promise<Unit[]> {
  console.log(`[API] Fetching units for Society: ${societyId}`);
  
  const res = await fetch(`${API_BASE}?societyId=${societyId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[API] Failed to fetch. Status: ${res.status}. Body: ${errorText}`);
    throw new Error(errorText || "Failed to fetch units");
  }

  const data = await res.json();
  const units = Array.isArray(data) ? data : (data.units || []);
  
  return units.map((u: any) => ({
    ...u,
    block_name: u.block_name || u.blockName || "",
    unit_number: u.unit_number || u.unitNumber || "",
    unit_type: u.unit_type ?? u.unitType ?? null,
    floor_number: u.floor_number ?? u.floorNumber ?? null,
    built_up_area: u.built_up_area ?? u.builtUpArea ?? null,
    status: u.status || "vacant",
  }));
}

async function createUnit(data: { society_id: string; block_name: string; unit_number: string; unit_type?: string | null; floor_number?: number | null; built_up_area?: number | null; status: UnitStatus }): Promise<Unit> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create unit");
  }
  return res.json();
}

async function updateUnit(unit_id: string, data: Partial<Unit>): Promise<Unit> {
  const res = await fetch(`${API_BASE}/${unit_id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update unit");
  return res.json();
}

async function toggleUnitStatus(unit_id: string, status: UnitStatus): Promise<void> {
  const res = await fetch(`${API_BASE}/${unit_id}/status?status=${status}`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Failed to update unit status");
}

const unitFormSchema = z.object({
  society_id: z.string().uuid("Society ID must be a valid UUID"),
  block_name: z.string().min(1, "Block name is required"),
  unit_number: z.string().min(1, "Unit number is required"),
  unit_type: z.string().nullable().optional(),
  floor_number: z.coerce.number().nullable().optional(),
  built_up_area: z.coerce.number().nullable().optional(),
  status: z.custom<UnitStatus>(
    (val) => typeof val === "string" && ["occupied", "vacant"].includes(val),
    { message: "Select a valid status" },
  ),
});

type UnitFormValues = z.infer<typeof unitFormSchema>;

type UnitFormProps = {
  mode: "create" | "edit";
  initialValues: UnitFormValues;
  onSubmit: (values: UnitFormValues) => Promise<void>;
  onCancel?: () => void;
};

function UnitForm({ mode, initialValues, onSubmit, onCancel }: UnitFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: initialValues,
  });

  const status = watch("status");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Society ID</label>
          <Input placeholder="Society UUID" {...register("society_id")} disabled />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Block Name</label>
          <Input placeholder="e.g., A Block, B Block" {...register("block_name")} />
          {errors.block_name && <p className="text-xs text-red-600">{errors.block_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Unit Number</label>
          <Input placeholder="e.g., 101, 202" {...register("unit_number")} />
          {errors.unit_number && <p className="text-xs text-red-600">{errors.unit_number.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Floor Number</label>
          <Input type="number" placeholder="e.g., 1, 2, 3" {...register("floor_number")} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Unit Type</label>
          <Input placeholder="e.g., 1BHK, 2BHK, 3BHK" {...register("unit_type")} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Built-up Area (sq ft)</label>
          <Input type="number" step="0.01" placeholder="e.g., 850.50" {...register("built_up_area")} />
          {errors.built_up_area && <p className="text-xs text-red-600">{errors.built_up_area.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Status</label>
          <Select
            defaultValue={initialValues.status}
            onValueChange={(v) => setValue("status", v as UnitStatus, { shouldValidate: true })}
          >
            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vacant">Vacant</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {mode === "create" ? "Create Unit" : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function UnitsPage() {
  const { user, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<UnitStatus | "ALL">("ALL");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogUnit, setEditDialogUnit] = useState<Unit | null>(null);

  const { data: units = [], isLoading: dataLoading, error: queryError } = useQuery<Unit[]>({
    queryKey: ["units", user?.society_id],
    queryFn: () => fetchUnits(user?.society_id || ""),
    enabled: !!user?.society_id && isAuthenticated,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      setCreateDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; values: UnitFormValues }) => updateUnit(payload.id, payload.values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      setEditDialogUnit(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => toggleUnitStatus(id, "vacant"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["units"] }),
  });

  const filteredUnits = useMemo(() => {
    return units.filter(u => {
      const block = u.block_name || "";
      const unitNum = u.unit_number || "";
      const type = u.unit_type || "";
      const floor = u.floor_number?.toString() || "";
      const matchesSearch = !searchTerm || 
        block.toLowerCase().includes(searchTerm.toLowerCase()) || 
        unitNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        floor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [units, searchTerm, statusFilter]);

  if (authLoading) return <div className="p-8 text-center">Verifying credentials...</div>;
  if (!isAuthenticated || !isAdmin) return <div className="p-8 text-center text-red-500">Access Denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Units</h1>
          <p className="text-slate-500">Managing units for Society ID: {user?.society_id}</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Create Unit</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Unit</DialogTitle></DialogHeader>
            <UnitForm
              mode="create"
              initialValues={{ 
                society_id: user?.society_id || "", 
                block_name: "", 
                unit_number: "", 
                unit_type: "", 
                floor_number: undefined, 
                built_up_area: undefined, 
                status: "vacant" 
              }}
              onSubmit={async (v) => { await createMutation.mutateAsync(v); }}
              onCancel={() => setCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {queryError && (
        <div className="bg-red-50 p-4 rounded-md text-red-700 text-sm">
          Session error: {(queryError as Error).message}. Try logging out and back in.
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex gap-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search units..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="vacant">Vacant</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Block</TableHead>
                <TableHead>Unit Number</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Built-up Area</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center">Loading units...</TableCell></TableRow>
              ) : filteredUnits.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400">No units found.</TableCell></TableRow>
              ) : filteredUnits.map(u => (
                <TableRow key={u.unit_id}>
                  <TableCell className="font-medium">{u.block_name}</TableCell>
                  <TableCell>{u.unit_number}</TableCell>
                  <TableCell>{u.floor_number ?? "-"}</TableCell>
                  <TableCell>{u.unit_type || "-"}</TableCell>
                  <TableCell>{u.built_up_area ? `${u.built_up_area} sq ft` : "-"}</TableCell>
                  <TableCell>
                    <Badge className={u.status === "vacant" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                      {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditDialogUnit(u)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(u.unit_id)} disabled={u.status === "vacant"}>Mark Vacant</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editDialogUnit} onOpenChange={() => setEditDialogUnit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Unit</DialogTitle></DialogHeader>
          {editDialogUnit && (
            <UnitForm
              mode="edit"
              initialValues={{ 
                ...editDialogUnit,
                unit_type: editDialogUnit.unit_type || "",
                floor_number: editDialogUnit.floor_number ?? undefined,
                built_up_area: editDialogUnit.built_up_area ?? undefined,
              }}
              onSubmit={async (v) => { await updateMutation.mutateAsync({ id: editDialogUnit.unit_id, values: v }); }}
              onCancel={() => setEditDialogUnit(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
