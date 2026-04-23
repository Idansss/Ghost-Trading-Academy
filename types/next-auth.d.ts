import { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      accountBalance: number;
      accountSize: number | null;
      riskPerTrade: number;
      avatarUrl: string | null;
    };
  }

  interface User {
    role: Role;
    accountBalance: number;
    accountSize: number | null;
    riskPerTrade: number;
    avatarUrl: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    accountBalance: number;
    accountSize: number | null;
    riskPerTrade: number;
    avatarUrl: string | null;
  }
}
