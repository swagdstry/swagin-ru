// lib/auth.ts
import NextAuth from "next-auth";
import Twitch from "next-auth/providers/twitch";
import type { JWT } from "next-auth/jwt";
import type { Account, Profile, Session, User } from "next-auth";

// Расширение типов
declare module "next-auth" {
  interface User {
    twitchId?: string;
    login?: string;
    displayName?: string;
  }
  interface Session {
    user: {
      accessToken?: string;
      twitchId?: string;
      login?: string;
      displayName?: string;
      error?: string;
    } & User;
  }
}

// Проверки env
if (!process.env.NEXTAUTH_SECRET) {
  console.error("NEXTAUTH_SECRET is required!");
}
if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
  console.error("TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET missing!");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    {
      id: "twitch",
      name: "Twitch",
      type: "oauth",
      clientId: process.env.TWITCH_CLIENT_ID || 'dummy-for-logs',
      clientSecret: process.env.TWITCH_CLIENT_SECRET || 'dummy-for-logs',
      issuer: "https://id.twitch.tv/oauth2", // ← фикс ошибки InvalidEndpoints
      authorization: {
        url: "https://id.twitch.tv/oauth2/authorize",
        params: {
          scope: "user:read:email channel:read:subscriptions user:read:subscriptions",
        },
      },
      token: "https://id.twitch.tv/oauth2/token",
      checks: ["pkce"],
      profile(profile: any) {
        return {
          id: profile.id || profile.sub || "",
          name: profile.login || profile.preferred_username || profile.name || "",
          email: profile.email,
          image: profile.profile_image_url,
          twitchId: profile.id || profile.sub || "",
          login: profile.login || profile.preferred_username || "",
          displayName: profile.display_name || profile.name || "",
        };
      },
    },
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt(params: {
      token: JWT;
      user?: User;
      account?: Account | null;
      profile?: Profile | null;
      trigger?: "signIn" | "signUp" | "update" | "session";
      isNewUser?: boolean;
      session?: any;
    }) {
      const { token, account, profile } = params;

      if (account) {
        token.accessToken = account.access_token as string | undefined;
        token.refreshToken = account.refresh_token as string | undefined;
        token.expiresAt = (account.expires_at ?? Math.floor(Date.now() / 1000) + 14400) * 1000;

        const p = profile as any;
        token.twitchId = p?.id ?? p?.sub ?? undefined;
        token.login = p?.login ?? p?.preferred_username ?? undefined;
        token.displayName = p?.display_name ?? p?.name ?? undefined;
      }

      if (
        typeof token.expiresAt === "number" &&
        Date.now() >= token.expiresAt &&
        typeof token.refreshToken === "string" &&
        process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET
      ) {
        const refreshed = await refreshTwitchToken(token.refreshToken);
        if (refreshed?.access_token) {
          token.accessToken = refreshed.access_token;
          token.refreshToken = refreshed.refresh_token ?? token.refreshToken;
          token.expiresAt = Date.now() + (refreshed.expires_in ?? 14400) * 1000;
          delete token.error;
        } else {
          token.error = "RefreshAccessTokenError";
        }
      }

      return token;
    },

    async session(params: {
      session: Session;
      token: JWT;
      user?: User;
      trigger?: "signIn" | "signUp" | "update" | "session";
    }) {
      const { session, token } = params;

      if (session.user) {
        session.user.accessToken = token.accessToken as string | undefined;
        session.user.twitchId = token.twitchId as string | undefined;
        session.user.login = token.login as string | undefined;
        session.user.displayName = token.displayName as string | undefined;
        session.error = token.error as string | undefined;
      }

      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
  },

  debug: process.env.NODE_ENV === "development",
});

async function refreshTwitchToken(refreshToken: string) {
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
    console.error("Env for refresh missing");
    return null;
  }

  try {
    const params = new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const res = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Refresh failed:", res.status, text);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("Refresh error:", err);
    return null;
  }
}