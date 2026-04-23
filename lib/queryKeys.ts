/**
 * Centralised React Query key factory.
 *
 * AUDIT FIX: Query keys were scattered as inline string arrays across the
 * codebase. Centralising them here guarantees that related queries share
 * the same key shape, making cache invalidation after mutations reliable
 * and refactors safe. Import and use these everywhere instead of raw arrays.
 */
export const queryKeys = {
  dashboard: ["dashboard"] as const,

  trades: {
    all: (userId?: string) => userId ? (["trades", userId] as const) : (["trades"] as const),
    list: (userId: string, filters: Record<string, unknown>) =>
      ["trades", userId, "list", filters] as const,
    detail: (id: string) => ["trades", id] as const,
    summary: (userId?: string) =>
      userId ? (["trades", userId, "summary"] as const) : (["trades", "summary"] as const),
  },

  analytics: {
    all: (userId: string, filters: Record<string, unknown>) =>
      ["analytics", userId, filters] as const,
  },

  signals: {
    all: (status?: string) => ["signals", status ?? "ALL"] as const,
    detail: (id: string) => ["signals", id] as const,
    taken: (id: string) => ["signals", id, "taken"] as const,
    // AUDIT FIX: Factory had ["signals", "stats"] but all real usage (useSignalMutations
    // invalidation + SignalsWinRateBadge query) uses ["signal-stats"]. Aligned to match.
    stats: ["signal-stats"] as const,
    trackRecord: (range: string) => ["signals", "track-record", range] as const,
  },

  profile: ["profile"] as const,

  dashboard_data: ["dashboard"] as const,

  notifications: {
    all: ["notifications"] as const,
    preferences: ["notifications", "preferences"] as const,
  },

  education: {
    courses: ["education", "courses"] as const,
    course: (id: string) => ["education", "courses", id] as const,
  },

  resources: {
    all: ["resources"] as const,
    detail: (id: string) => ["resources", id] as const,
  },

  leaderboard: ["leaderboard"] as const,

  watchlist: ["watchlist"] as const,

  outlook: ["outlook"] as const,

  chat: {
    channels: ["chat", "channels"] as const,
    // AUDIT FIX: Factory had segment order ["chat", channelId, "messages"] but
    // useChat.ts uses ["chat", "messages", channelId]. Aligned to match actual hooks.
    messages: (channelId: string) => ["chat", "messages", channelId] as const,
    pinned: (channelId: string) => ["chat", "pinned", channelId] as const,
  },

  memberWins: {
    all: ["member-wins"] as const,
  },

  weeklyRecaps: {
    all: ["weekly-recaps"] as const,
    detail: (id: string) => ["weekly-recaps", id] as const,
  },

  weeklyReview: {
    current: ["journal", "weekly-review"] as const,
    history: ["journal", "weekly-review", "history"] as const,
  },

  announcements: {
    all: ["announcements"] as const,
  },

  admin: {
    members: ["admin", "members"] as const,
    overview: ["admin", "overview"] as const,
    auditLog: ["admin", "audit-log"] as const,
    engagement: ["admin", "engagement"] as const,
    broadcast: ["admin", "broadcast"] as const,
    siteConfig: ["admin", "site-config"] as const,
    tags: ["admin", "tags"] as const,
    reports: ["admin", "reports"] as const,
  },

  tradeTags: ["trade-tags"] as const,
};
