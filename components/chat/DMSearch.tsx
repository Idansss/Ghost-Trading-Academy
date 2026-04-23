"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fetchJson } from "@/lib/client-api";
import { useStartDM } from "@/hooks/useChat";

type SearchUser = {
  id: string;
  name: string;
  image: string | null;
};

export function DMSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { mutateAsync: startDm, isPending } = useStartDM();

  useEffect(() => {
    if (!open || !query.trim()) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetchJson<{ data: { users: SearchUser[] } }>(
          `/api/users/search?q=${encodeURIComponent(query)}`,
        );
        setUsers(response.data.users);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [open, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a direct message</DialogTitle>
        </DialogHeader>
        <Input
          aria-label="Search members"
          placeholder="Search by name or email..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {isLoading ? <p className="text-sm text-muted-foreground">Searching members...</p> : null}

          {!isLoading && query.trim() && users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members match your search.</p>
          ) : null}

          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              aria-label={`Message ${user.name}`}
              className="w-full rounded-lg border border-border px-3 py-2 text-left hover:bg-muted/60"
              disabled={isPending}
              onClick={async () => {
                await startDm(user.id);
                onOpenChange(false);
              }}
            >
              <p className="text-sm font-medium">{user.name}</p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
