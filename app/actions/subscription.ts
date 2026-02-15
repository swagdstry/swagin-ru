// actions/subscription.ts
'use server';

import { auth } from '@/lib/auth';

export async function checkSubscription() {
  const session = await auth();

  if (!session?.user?.twitchId || !session?.user?.accessToken) {
    return { subscribed: false };
  }

  const accessToken = session.user.accessToken as string;
  const userId = session.user.twitchId as string;

  const broadcasterId = process.env.TWITCH_CHANNEL_ID ?? '1417889713';

  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/subscriptions?broadcaster_id=${broadcasterId}&user_id=${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Client-Id': process.env.TWITCH_CLIENT_ID ?? '',
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[SUBSCRIPTION] Twitch error:', res.status, errorText);
      return { subscribed: false };
    }

    const data = await res.json();
    const sub = data.data?.[0];

    if (sub) {
      return {
        subscribed: true,
        tier: sub.tier,
        isGift: sub.is_gift,
      };
    }

    return { subscribed: false };
  } catch (err) {
    console.error('[SUBSCRIPTION] error:', err);
    return { subscribed: false };
  }
}