// lib/auth.ts
import NextAuth from 'next-auth';
import TwitchProvider from 'next-auth/providers/twitch';

if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
  console.error('TWITCH_CLIENT_ID или TWITCH_CLIENT_SECRET не заданы!');
}

if (!process.env.NEXTAUTH_SECRET) {
  console.error('NEXTAUTH_SECRET не задан!');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID || 'dummy',
      clientSecret: process.env.TWITCH_CLIENT_SECRET || 'dummy',
      authorization: {
        params: {
          scope: 'user:read:email user:read:subscriptions openid',
        },
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: 'jwt',
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

      // Refresh логика с проверками
      if (
        typeof token.expiresAt === 'number' &&
        Date.now() >= token.expiresAt &&
        typeof token.refreshToken === 'string'
      ) {
        const refreshed = await refreshTwitchToken(token.refreshToken);
        if (refreshed?.access_token) {
          token.accessToken = refreshed.access_token;
          token.refreshToken = refreshed.refresh_token ?? token.refreshToken;
          token.expiresAt = Date.now() + (refreshed.expires_in ?? 14400) * 1000;
          delete token.error;
        } else {
          token.error = 'RefreshAccessTokenError';
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
    signIn: '/auth/login',
    error: '/auth/error',  // добавь, если хочешь кастомную страницу ошибки
  },

  debug: process.env.NODE_ENV === 'development',  // только в dev
});

async function refreshTwitchToken(refreshToken: string) {
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
    console.error('Env для refresh отсутствует');
    return null;
  }

  try {
    const params = new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const res = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) {
      console.error('Refresh failed:', res.status, await res.text());
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error('Refresh error:', err);
    return null;
  }
}