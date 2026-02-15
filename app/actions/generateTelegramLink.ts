// app/actions/generateTelegramLink.ts
'use server';

import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export async function generateTelegramLink() {
  const session = await auth();
  if (!session?.user?.twitchId) {
    return { success: false, message: 'Не авторизован' };
  }

  const twitchId = session.user.twitchId;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('telegram_id, telegram_link_code')
    .eq('twitch_id', twitchId)
    .single();

  if (profile?.telegram_id) {
    return { success: false, message: 'Telegram уже привязан', alreadyLinked: true };
  }

  let code = profile?.telegram_link_code;

  if (!code) {
    code = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 hex символов

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ telegram_link_code: code })
      .eq('twitch_id', twitchId);

    if (error) return { success: false, message: 'Ошибка сервера' };
  }

  const botUsername = 'swagdestroy_bonus_bot';

  return {
    success: true,
    link: `https://t.me/${botUsername}?start=${code}`,
  };
}