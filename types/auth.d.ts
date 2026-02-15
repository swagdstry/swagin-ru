// types/next-auth.d.ts

// Импортируем DefaultSession из next-auth (это правильный источник в v5)
import { DefaultSession } from "next-auth";

// Импортируем типы из @auth/core — это основной модуль в v5
import type { JWT } from "@auth/core/jwt";
import type { Session } from "@auth/core/types";

// Расширение Session (для useSession, getServerSession и т.д.)
declare module "next-auth" {
  interface Session {
    user: {
      twitchId?: string;
      login?: string;
      displayName?: string;
      accessToken?: string;
    } & DefaultSession["user"];
    error?: string;
  }
}

// Расширение JWT — используем @auth/core/jwt (не next-auth/jwt!)
declare module "@auth/core/jwt" {
  interface JWT {
    twitchId?: string;
    login?: string;
    displayName?: string;
    accessToken?: string;
    refreshToken?: string | null;
    expiresAt?: number;
    error?: string;
  }
}

// Для клиента (useSession из next-auth/react) — дублируем расширение
declare module "next-auth/react" {
  interface Session {
    user: {
      twitchId?: string;
      login?: string;
      displayName?: string;
      accessToken?: string;
    } & DefaultSession["user"];
    error?: string;
  }
}