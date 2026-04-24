import { requireUser } from "@/lib/auth";
import { signalFilterStatuses } from "@/lib/signal-performance";
import { SignalsPageClient } from "@/components/signals/SignalsPageClient";

type SignalStatus = (typeof signalFilterStatuses)[number];

export default async function SignalsPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  const user = await requireUser();
  const status = (searchParams?.status?.toUpperCase() ?? "ALL") as SignalStatus;

  return <SignalsPageClient status={status} isAdmin={user.role === "ADMIN"} />;
}
