// app/api/user/profile/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  console.log('[PROFILE] Запрос /api/user/profile ПОЛУЧЕН');

  const session = await auth();

  console.log('[PROFILE] Сессия получена:', session ? 'есть' : 'отсутствует');
  console.log('[PROFILE] twitchId в сессии:', session?.user?.twitchId || 'ОТСУТСТВУЕТ');

  if (!session?.user?.twitchId) {
    console.log('[PROFILE] Нет twitchId → возвращаем 401');
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const twitchId = session.user.twitchId;
  const twitchLogin = session.user.login || session.user.name || 'unknown';

  console.log('[PROFILE] Ищем профиль по twitch_id:', twitchId);

  // Запрашиваем все нужные поля сразу
  let { data, error } = await supabaseAdmin
    .from('profiles')
    .select('points, telegram_id, telegram_username, bonus_claimed')
    .eq('twitch_id', twitchId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') { // PGRST116 = нет записи
    console.error('[PROFILE] Ошибка Supabase при поиске:', error.message, error.details);
    // Не падаем, возвращаем дефолт
    return NextResponse.json({
      points: 0,
      bonus_claimed: false,
      telegram_id: null,
      telegram_username: null,
    });
  }

  // Если записи нет — создаём новую
  if (!data) {
    console.log('[PROFILE] Профиль НЕ найден — создаём новый');

    const { data: newProfile, error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        twitch_id: twitchId,
        twitch_login: twitchLogin,
        points: 0,
        role: 'user',
        bonus_claimed: false,
        telegram_id: null,
        telegram_username: null,
      })
      .select('points, telegram_id, telegram_username, bonus_claimed')
      .single();

    if (insertError) {
      console.error('[PROFILE] Ошибка создания профиля:', insertError.message, insertError.details || insertError.hint);
      // Не падаем — возвращаем дефолт
      return NextResponse.json({
        points: 0,
        bonus_claimed: false,
        telegram_id: null,
        telegram_username: null,
      });
    }

    console.log('[PROFILE] Профиль успешно создан:', newProfile);
    data = newProfile;
  } else {
    console.log('[PROFILE] Профиль найден:', data);
  }

  console.log('[PROFILE] Успех — возвращаем данные:', {
    points: data.points,
    bonus_claimed: data.bonus_claimed,
    telegram_id: data.telegram_id,
    telegram_username: data.telegram_username,
  });

  return NextResponse.json({
    points: data.points ?? 0,
    bonus_claimed: data.bonus_claimed ?? false,
    telegram_id: data.telegram_id ?? null,
    telegram_username: data.telegram_username ?? null,
  });
}