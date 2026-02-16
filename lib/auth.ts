// lib/auth.ts
import NextAuth from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,

      authorization: {
        params: {
          scope: "user:read:email channel:read:subscriptions user:read:subscriptions",
        },
      },

      // ← Главный фикс для Twitch (он не возвращает id_token)
      checks: ["pkce"],
      idToken: false,
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

        token.twitchId = profile?.id ?? (profile as any)?.sub;
        token.login = profile?.login ?? (profile as any)?.preferred_username;
        token.displayName = profile?.display_name ?? profile?.name;
      }

      // Refresh token
      if (
        typeof token.expiresAt === "number" &&
        Date.now() >= token.expiresAt &&
        typeof token.refreshToken === "string" &&
        process.env.TWITCH_CLIENT_ID &&
        process.env.TWITCH_CLIENT_SECRET
      ) {
        const refreshed = await refreshTwitchToken(token.refreshToken);
        if (refreshed?.access_token) {
          token.accessToken = refreshed.access_token;
          token.refreshToken = refreshed.refresh_token ?? token.refreshToken;
          token.expiresAt = Date.now() + (refreshed.expires_in ?? 14400) * 1000;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.accessToken = token.accessToken as string | undefined;
      session.user.twitchId = token.twitchId as string | undefined;
      session.user.login = token.login as string | undefined;
      session.user.displayName = token.displayName as string | undefined;
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
  },

  debug: process.env.NODE_ENV === "development",
});

// Refresh функция
async function refreshTwitchToken(refreshToken: string) {
  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID!,
    client_secret: process.env.TWITCH_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) return null;
  return res.json();
}