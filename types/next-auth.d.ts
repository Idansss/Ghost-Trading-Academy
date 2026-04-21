import { DefaultSession } from "next-auth";
import { Role, SubscriptionStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      subscriptionStatus: SubscriptionStatus;
      subscriptionExpiry: Date | null;
      accountBalance: number;
      avatarUrl: string | null;
    };
  }

  interface User {
    role: Role;
    subscriptionStatus: SubscriptionStatus;
    subscriptionExpiry: Date | null;
    accountBalance: number;
    avatarUrl: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    subscriptionStatus: SubscriptionStatus;
    subscriptionExpiry: string | null;
    accountBalance: number;
    avatarUrl: string | null;
  }
}
