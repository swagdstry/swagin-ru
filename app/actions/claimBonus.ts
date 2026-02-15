// app/actions/claimBonus.ts
'use server';

import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function claimBonus() {
  const session = await auth();

  if (!session?.user?.twitchId) {
    return { success: false, message: 'Не авторизован' };
  }

  const twitchId = session.user.twitchId;

  // Получаем профиль (добавили telegram_id)
  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('points, bonus_claimed, telegram_id')
    .eq('twitch_id', twitchId)
    .maybeSingle();  // ← используем maybeSingle, чтобы не падало при отсутствии строки

  if (fetchError) {
    console.error('Ошибка получения профиля:', fetchError);
    return { success: false, message: 'Ошибка сервера при загрузке профиля' };
  }

  if (!profile) {
    return { success: false, message: 'Профиль не найден. Попробуйте перезайти.' };
  }

  if (profile.bonus_claimed) {
    return { success: false, message: 'Бонус уже получен' };
  }

  if (!profile.telegram_id) {
    return { success: false, message: 'Сначала привяжите Telegram аккаунт на дашборде' };
  }

  // Проверка подписки через Telegram Bot API
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channel = process.env.TELEGRAM_CHANNEL || '@swagdestroy';  // или числовой -100...

  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN не задан');
    return { success: false, message: 'Ошибка конфигурации бота' };
  }

  try {
    const apiUrl = `https://api.telegram.org/bot${token}/getChatMember?chat_id=${channel}&user_id=${profile.telegram_id}`;
    const res = await fetch(apiUrl);

    if (!res.ok) {
      const errText = await res.text();
      console.error('Telegram API ошибка:', res.status, errText);
      return { success: false, message: 'Не удалось связаться с Telegram' };
    }

    const json = await res.json();

    if (!json.ok) {
      console.error('Telegram getChatMember failed:', json);
      return { success: false, message: json.description || 'Ошибка проверки подписки' };
    }

    const status = json.result?.status;

    const isSubscribed = ['member', 'administrator', 'creator'].includes(status);

    if (!isSubscribed) {
      return { success: false, message: 'Вы не подписаны на канал. Подпишитесь и попробуйте снова.' };
    }

    // Всё ок → начисляем +15
    const newPoints = (profile.points || 0) + 15;

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        points: newPoints,
        bonus_claimed: true,
      })
      .eq('twitch_id', twitchId);

    if (updateError) {
      console.error('Ошибка начисления бонуса:', updateError);
      return { success: false, message: 'Ошибка при начислении баллов' };
    }

    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Вы получили +15 баллов за подписку на Telegram!',
      newPoints,
    };
  } catch (err) {
    console.error('Исключение при проверке Telegram:', err);
    return { success: false, message: 'Произошла ошибка при проверке подписки' };
  }
}