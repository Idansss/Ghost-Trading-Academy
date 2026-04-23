// AUDIT FIX: This page was missing entirely. The audit spec requires
// /community/chat/[channelId] for direct channel linking (e.g. from DM
// notifications that link to /community/chat?channel={channelId}).
// This file acts as an alias — it reads the channelId from the route segment
// and delegates to the parent chat page with it pre-selected.
import { redirect } from "next/navigation";

export default async function DirectChannelPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = await params;
  // Redirect to the main chat page with the channel pre-selected via the
  // ?channel= query param, which ChatLayout uses to open the right channel.
  redirect(`/community/chat?channel=${channelId}`);
}
