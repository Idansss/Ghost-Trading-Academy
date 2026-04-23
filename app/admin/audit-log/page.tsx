"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/client-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
  user: { name: string | null; email: string };
};

export default function AdminAuditLogPage() {
  const query = useQuery({
    queryKey: ["admin-audit-log"],
    queryFn: () => fetchJson<{ logs: AuditLog[] }>("/api/admin/audit-log"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Audit Log</h1>
      <Card>
        <CardHeader>
          <CardTitle>Admin Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(query.data?.logs ?? []).map((log) => (
            <div key={log.id} className="rounded-xl border p-3 text-sm">
              <p className="font-medium">{log.action}</p>
              <p className="text-muted-foreground">
                {log.entity} ({log.entityId}) by {log.user.name ?? log.user.email}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
