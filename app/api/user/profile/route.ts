// app/api/user/profile/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  console.log('[PROFILE] Запрос /api/user/profile ПОЛУЧЕН');

  const session = await auth();
  console.log('[PROFILE] Сессия:', session ? 'есть' : 'отсутствует');
  console.log('[PROFILE] twitchId:', session?.user?.twitchId || 'ОТСУТСТВУЕТ');

  if (!session?.user?.twitchId) {
    console.log('[PROFILE] Нет twitchId → 401');
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const twitchId = session.user.twitchId;
  const twitchLogin = session.user.login || session.user.name || 'unknown';

  console.log('[PROFILE] Ищем профиль по twitch_id:', twitchId);

  // Запрашиваем ТОЛЬКО существующие поля
  let { data, error } = await supabaseAdmin
    .from('profiles')
    .select('points, telegram_id, bonus_claimed')  // ← убрал telegram_username, если его нет
    .eq('twitch_id', twitchId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('[PROFILE] Supabase ошибка при поиске:', error.message, error.details);
    return NextResponse.json({
      points: 0,
      bonus_claimed: false,
      telegram_id: null,
    });
  }

  if (!data) {
    console.log('[PROFILE] Профиль не найден — создаём');

    const { data: newProfile, error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        twitch_id: twitchId,
        twitch_login: twitchLogin,
        points: 0,
        role: 'user',
        bonus_claimed: false,
        telegram_id: null,
      })
      .select('points, telegram_id, bonus_claimed')
      .single();

    if (insertError) {
      console.error('[PROFILE] Ошибка создания:', insertError.message, insertError.details || '');
      return NextResponse.json({
        points: 0,
        bonus_claimed: false,
        telegram_id: null,
      });
    }

    console.log('[PROFILE] Профиль создан:', newProfile);
    data = newProfile;
  } else {
    console.log('[PROFILE] Профиль найден:', data);
  }

  return NextResponse.json({
    points: data.points ?? 0,
    bonus_claimed: data.bonus_claimed ?? false,
    telegram_id: data.telegram_id ?? null,
  });
}