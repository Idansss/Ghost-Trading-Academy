"use client";

import type { Role } from "@prisma/client";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageTransition } from "@/components/layout/PageTransition";
import { roleDisplayName } from "@/lib/role-display";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchJson } from "@/lib/client-api";
import { memberCreateSchema } from "@/lib/validators";

type AdminMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  twoFactorEnabled: boolean;
  createdAt: string | Date;
};

type MemberUpdatePayload = {
  userId: string;
  role: Role;
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
};

type MemberInsightsResponse = {
  member: {
    id: string;
    name: string;
    email: string;
    onboardingCompleted: boolean;
    emailAlertsEnabled: boolean;
    pushEnabled: boolean;
  };
  stats: {
    totalTrades: number;
    winRate: number;
    totalR: number;
    currentStreak: number;
    lastActiveDate: string;
    signalTakenCount: number;
    signalTaken: Array<{ id: string; coin: string; direction: string }>;
    signalViewCount: number;
    resourcesCompleted: number;
    courseProgress: { completed: number; total: number };
    psychologyTrend: Array<{ weekStart: string; score: number }>;
  };
};

const defaultCreateState: CreateMemberState = {
  name: "",
  email: "",
  temporaryPassword: "",
  role: "MEMBER",
};

const ASSIGNABLE_ROLES: Role[] = ["MEMBER", "PREMIUM", "ADMIN"];

function roleBadgeVariant(role: Role) {
  return role === "MEMBER" ? "muted" : "default";
}

export default function AdminMembersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [createState, setCreateState] = useState<CreateMemberState>(defaultCreateState);
  const [pendingRoleChange, setPendingRoleChange] = useState<RoleChangeState>(null);
  const [deleteUser, setDeleteUser] = useState<AdminMember | null>(null);
  const [selectedMember, setSelectedMember] = useState<AdminMember | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["members"],
    queryFn: () => fetchJson<{ users: AdminMember[] }>("/api/admin/members"),
  });

  const insightsQuery = useQuery({
    queryKey: ["member-insights", selectedMember?.id],
    enabled: Boolean(selectedMember?.id),
    queryFn: () =>
      fetchJson<MemberInsightsResponse>(`/api/admin/members/${selectedMember!.id}/insights`),
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
      }).then((response) => ({ response, successMessage })),
    onSuccess: async ({ successMessage }) => {
      toast.success(successMessage);
      await invalidateMembers();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateMemberState) =>
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
        <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Members" }]} />
        <PageHeader
          eyebrow="Admin"
          title="Manage Members"
          description="Control roles and manage member accounts."
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
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-14 rounded-2xl bg-muted/50" />
                ))}
              </div>
            ) : isError ? (
              <div className="p-6">
                <ErrorState
                  title="Members unavailable"
                  description="There was a problem loading the member table."
                  onRetry={() => {
                    void refetch();
                  }}
                />
              </div>
            ) : data?.users.length ? (
              <div className="overflow-x-auto">
                <div className="min-w-max px-6 pb-6">
                  <Table className="min-w-[640px] w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>2FA</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.users.map((user) => {
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
                                  aria-label={`Role for ${user.name}`}
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
                                  {ASSIGNABLE_ROLES.map((roleOption) => (
                                    <option key={roleOption} value={roleOption}>
                                      {roleDisplayName(roleOption)}
                                    </option>
                                  ))}
                                </select>
                                <Badge variant={roleBadgeVariant(user.role)}>
                                  <span className="status-dot bg-current" />
                                  {roleDisplayName(user.role)}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(user.createdAt), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>{user.twoFactorEnabled ? "Enabled" : "Disabled"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedMember(user)}
                                >
                                  View
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
                </div>
              </div>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={<Plus className="h-12 w-12" />}
                  title="No members found"
                  description="Create the first member account to populate the admin table."
                />
              </div>
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

                const parsed = memberCreateSchema.safeParse(createState);

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
                  aria-label="New member role"
                  className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                  value={createState.role}
                  onChange={(event) =>
                    setCreateState((current) => ({
                      ...current,
                      role: event.target.value as Role,
                    }))
                  }
                >
                  {ASSIGNABLE_ROLES.map((roleOption) => (
                    <option key={roleOption} value={roleOption}>
                      {roleDisplayName(roleOption)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <Button disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create member"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(selectedMember)}
          onOpenChange={(open) => {
            if (!open) setSelectedMember(null);
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Member Detail</DialogTitle>
              <DialogDescription>
                {selectedMember?.name} - {selectedMember?.email}
              </DialogDescription>
            </DialogHeader>
            {insightsQuery.isLoading || !insightsQuery.data ? (
              <p className="text-sm text-muted-foreground">Loading member insights...</p>
            ) : (
              <div className="space-y-3 text-sm">
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    if (!selectedMember) return;
                    const channel = await fetchJson<{ id: string }>(`/api/chat/dm/${selectedMember.id}`, {
                      method: "POST",
                    });
                    router.push(`/community/chat?channel=${channel.id}`);
                  }}
                >
                  Message Member
                </Button>
                <p>Total trades: {insightsQuery.data.stats.totalTrades}</p>
                <p>Win rate: {insightsQuery.data.stats.winRate.toFixed(1)}%</p>
                <p>Total R: {insightsQuery.data.stats.totalR.toFixed(2)}R</p>
                <p>Current streak: {insightsQuery.data.stats.currentStreak}</p>
                <p>Signals taken: {insightsQuery.data.stats.signalTakenCount}</p>
                <p>Signals viewed: {insightsQuery.data.stats.signalViewCount}</p>
                <p>Resources completed: {insightsQuery.data.stats.resourcesCompleted}</p>
                <p>
                  Courses completed: {insightsQuery.data.stats.courseProgress.completed}/
                  {insightsQuery.data.stats.courseProgress.total}
                </p>
                <p>Onboarding completed: {insightsQuery.data.member.onboardingCompleted ? "Yes" : "No"}</p>
                <p>Email alerts enabled: {insightsQuery.data.member.emailAlertsEnabled ? "Yes" : "No"}</p>
                <p>Push enabled: {insightsQuery.data.member.pushEnabled ? "Yes" : "No"}</p>
                <p>
                  Psychology trend (4 weeks):{" "}
                  {insightsQuery.data.stats.psychologyTrend.map((item) => item.score).join(" / ")}
                </p>
              </div>
            )}
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
                  ? `Change ${pendingRoleChange.user.name} to ${roleDisplayName(pendingRoleChange.role)}?`
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
