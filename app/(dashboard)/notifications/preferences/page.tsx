"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/client-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

type NotificationPreference = {
  type: string;
  inApp: boolean;
  email: boolean;
  push: boolean;
};

export default function NotificationPreferencesPage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () =>
      fetchJson<{ preferences: NotificationPreference[] }>("/api/notifications/preferences"),
  });
  const mutation = useMutation({
    mutationFn: (payload: NotificationPreference) =>
      fetchJson("/api/notifications/preferences", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Notification Preferences</h1>
      <Card>
        <CardHeader>
          <CardTitle>Channel Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(query.data?.preferences ?? []).map((item) => (
            <div key={item.type} className="grid grid-cols-4 items-center gap-3 rounded-xl border p-3">
              <p className="text-sm font-medium">{item.type}</p>
              <Switch
                checked={item.inApp}
                onCheckedChange={(value) => mutation.mutate({ ...item, inApp: value })}
              />
              <Switch
                checked={item.email}
                onCheckedChange={(value) => mutation.mutate({ ...item, email: value })}
              />
              <Switch
                checked={item.push}
                onCheckedChange={(value) => mutation.mutate({ ...item, push: value })}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
