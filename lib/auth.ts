// lib/auth.ts
import NextAuth from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";

// Проверки env (очень важно для Vercel и дебага)
if (!process.env.NEXTAUTH_SECRET) {
  console.error("NEXTAUTH_SECRET is required!");
}
if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
  console.error("TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET missing!");
}
if (!process.env.NEXTAUTH_URL) {
  console.error("NEXTAUTH_URL is missing!");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID || 'dummy-for-logs',
      clientSecret: process.env.TWITCH_CLIENT_SECRET || 'dummy-for-logs',
      authorization: {
        params: {
          scope: 'user:read:email channel:read:subscriptions user:read:subscriptions',
        },
      },
      // КРИТИЧЕСКИЙ ФИКС: отключаем ожидание id_token (Twitch его не даёт)
      checks: ['pkce'],

      // Маппинг профиля вручную (Twitch возвращает нестандартный формат)
      profile(profile) {
        return {
          id: profile.id,
          name: profile.login,
          email: profile.email,
          image: profile.profile_image_url,
          twitchId: profile.id,
          login: profile.login,
          displayName: profile.display_name,
        };
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token ?? null;
        token.expiresAt = (account.expires_at ?? Math.floor(Date.now() / 1000) + 14400) * 1000;

        token.twitchId = profile?.id ?? profile?.sub;
        token.login = profile?.login ?? profile?.preferred_username;
        token.displayName = profile?.display_name ?? profile?.name;
      }

      // Refresh с явной проверкой типа (фикс TS ошибки >=)
      const expiresAt = token.expiresAt as number | undefined;

      if (
        expiresAt != null &&
        typeof expiresAt === "number" &&
        Date.now() >= expiresAt &&
        typeof token.refreshToken === "string" &&
        process.env.TWITCH_CLIENT_ID &&
        process.env.TWITCH_CLIENT_SECRET
      ) {
        console.log('[AUTH] Refreshing Twitch token...');
        const refreshed = await refreshTwitchToken(token.refreshToken);
        if (refreshed?.access_token) {
          token.accessToken = refreshed.access_token;
          token.refreshToken = refreshed.refresh_token ?? token.refreshToken;
          token.expiresAt = Date.now() + (refreshed.expires_in ?? 14400) * 1000;
          delete token.error;
          console.log('[AUTH] Token refreshed successfully');
        } else {
          token.error = "RefreshAccessTokenError";
          console.error('[AUTH] Token refresh failed');
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
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
    error: "/auth/error", 
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