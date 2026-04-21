"use client";

import type { Role, SubscriptionStatus } from "@prisma/client";
import { format } from "date-fns";
import { CalendarIcon, Plus, ShieldOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchJson } from "@/lib/client-api";
import { memberCreateSchema } from "@/lib/validators";

type AdminMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiry: string | Date | null;
  createdAt: string | Date;
};

type MemberUpdatePayload = {
  userId: string;
  role: Role;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiry: string | null;
};

type RoleChangeState = {
  user: AdminMember;
  role: Role;
} | null;

type CreateMemberState = {
  name: string;
  email: string;
  temporaryPassword: string;
  role: Role;
  subscriptionExpiry: Date | undefined;
};

const defaultCreateState: CreateMemberState = {
  name: "",
  email: "",
  temporaryPassword: "",
  role: "MEMBER",
  subscriptionExpiry: undefined,
};

function roleBadgeVariant(role: Role) {
  return role === "MEMBER" ? "muted" : "default";
}

function statusBadgeVariant(status: SubscriptionStatus) {
  if (status === "ACTIVE") {
    return "success";
  }

  if (status === "EXPIRED") {
    return "danger";
  }

  return "warning";
}

export default function AdminMembersPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [createState, setCreateState] = useState<CreateMemberState>(defaultCreateState);
  const [pendingRoleChange, setPendingRoleChange] = useState<RoleChangeState>(null);
  const [suspendUser, setSuspendUser] = useState<AdminMember | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminMember | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["members"],
    queryFn: () => fetchJson<{ users: AdminMember[] }>("/api/admin/members"),
  });

  const invalidateMembers = async () => {
    await queryClient.invalidateQueries({ queryKey: ["members"] });
  };

  const updateMutation = useMutation({
    mutationFn: ({
      payload,
      successMessage,
    }: {
      payload: MemberUpdatePayload;
      successMessage: string;
    }) =>
      fetchJson("/api/admin/members", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }).then((response) => ({ response, successMessage, payload })),
    onSuccess: async ({ successMessage }) => {
      toast.success(successMessage);
      await invalidateMembers();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      email: string;
      temporaryPassword: string;
      role: Role;
      subscriptionExpiry: string | null;
    }) =>
      fetchJson("/api/admin/members", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      toast.success("Member created.");
      setCreateOpen(false);
      setCreateState(defaultCreateState);
      await invalidateMembers();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/admin/members/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Member deleted");
      setDeleteUser(null);
      await invalidateMembers();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageTransition>
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Members"
        title="Manage Members"
        description="Control roles and subscription status for every member account."
        action={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add member
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-14 rounded-2xl bg-muted/50" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState
              title="Members unavailable"
              description="There was a problem loading the member table."
              onRetry={() => {
                void refetch();
              }}
            />
          ) : data?.users.length ? (
            <Table className="min-w-[640px] w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((user) => {
                  const subscriptionExpiry = user.subscriptionExpiry
                    ? new Date(user.subscriptionExpiry)
                    : null;
                  const isRowUpdating =
                    updateMutation.isPending &&
                    updateMutation.variables?.payload.userId === user.id;

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <p className="font-medium">{user.name}</p>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <select
                            className="h-9 rounded-xl border border-border bg-background px-3 text-sm"
                            value={user.role}
                            disabled={isRowUpdating}
                            onChange={(event) =>
                              setPendingRoleChange({
                                user,
                                role: event.target.value as Role,
                              })
                            }
                          >
                            {["MEMBER", "VIP", "ADMIN"].map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                          <Badge variant={roleBadgeVariant(user.role)}>
                            <span className="status-dot bg-current" />
                            {user.role}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(user.subscriptionStatus)}>
                          <span className="status-dot bg-current" />
                          {user.subscriptionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {subscriptionExpiry
                              ? format(subscriptionExpiry, "MMM d, yyyy")
                              : "No expiry"}
                          </span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button type="button" variant="ghost" size="icon">
                                <CalendarIcon className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={subscriptionExpiry ?? undefined}
                                onSelect={(date) => {
                                  if (!date) {
                                    return;
                                  }

                                  updateMutation.mutate({
                                    payload: {
                                      userId: user.id,
                                      role: user.role,
                                      subscriptionStatus: user.subscriptionStatus,
                                      subscriptionExpiry: format(date, "yyyy-MM-dd"),
                                    },
                                    successMessage: "Expiry updated",
                                  });
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSuspendUser(user)}
                          >
                            <ShieldOff className="mr-2 h-4 w-4" />
                            Suspend
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteUser(user)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={<Plus className="h-12 w-12" />}
              title="No members found"
              description="Create the first member account to populate the admin table."
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create member</DialogTitle>
            <DialogDescription>
              Add a user manually and issue temporary credentials.
            </DialogDescription>
          </DialogHeader>

          <form
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();

              const payload = {
                name: createState.name,
                email: createState.email,
                temporaryPassword: createState.temporaryPassword,
                role: createState.role,
                subscriptionExpiry: createState.subscriptionExpiry
                  ? format(createState.subscriptionExpiry, "yyyy-MM-dd")
                  : null,
              };

              const parsed = memberCreateSchema.safeParse(payload);

              if (!parsed.success) {
                toast.error("Please complete the member form correctly.");
                return;
              }

              await createMutation.mutateAsync(parsed.data);
            }}
          >
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={createState.name}
                onChange={(event) =>
                  setCreateState((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={createState.email}
                onChange={(event) =>
                  setCreateState((current) => ({ ...current, email: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Temporary password</Label>
              <Input
                type="password"
                value={createState.temporaryPassword}
                onChange={(event) =>
                  setCreateState((current) => ({
                    ...current,
                    temporaryPassword: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                value={createState.role}
                onChange={(event) =>
                  setCreateState((current) => ({
                    ...current,
                    role: event.target.value as Role,
                  }))
                }
              >
                {["MEMBER", "VIP", "ADMIN"].map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Subscription expiry</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {createState.subscriptionExpiry
                      ? format(createState.subscriptionExpiry, "PPP")
                      : "Select expiry date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={createState.subscriptionExpiry}
                    onSelect={(date) =>
                      setCreateState((current) => ({
                        ...current,
                        subscriptionExpiry: date,
                      }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="md:col-span-2">
              <Button disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create member"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(pendingRoleChange)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRoleChange(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingRoleChange
                ? `Change ${pendingRoleChange.user.name} to ${pendingRoleChange.role}?`
                : "Change role?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This updates the member&apos;s access level immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingRoleChange) {
                  return;
                }

                updateMutation.mutate({
                  payload: {
                    userId: pendingRoleChange.user.id,
                    role: pendingRoleChange.role,
                    subscriptionStatus: pendingRoleChange.user.subscriptionStatus,
                    subscriptionExpiry: pendingRoleChange.user.subscriptionExpiry
                      ? format(new Date(pendingRoleChange.user.subscriptionExpiry), "yyyy-MM-dd")
                      : null,
                  },
                  successMessage: "Role updated",
                });
                setPendingRoleChange(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(suspendUser)}
        onOpenChange={(open) => {
          if (!open) {
            setSuspendUser(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {suspendUser ? `Suspend ${suspendUser.name}?` : "Suspend member?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Their VIP access will be revoked immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!suspendUser) {
                  return;
                }

                updateMutation.mutate({
                  payload: {
                    userId: suspendUser.id,
                    role: "MEMBER",
                    subscriptionStatus: "EXPIRED",
                    subscriptionExpiry: format(new Date(), "yyyy-MM-dd"),
                  },
                  successMessage: "Member suspended",
                });
                setSuspendUser(null);
              }}
            >
              Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deleteUser)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteUser(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteUser ? `Permanently delete ${deleteUser.name}?` : "Delete member?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all their trades, notes, and account data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteUser) {
                  deleteMutation.mutate(deleteUser.id);
                }
              }}
            >
              Delete member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </PageTransition>
  );
}
