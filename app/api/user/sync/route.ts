// app/api/user/sync/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase'; // ← берём готовую константу

export async function POST() {
  const session = await auth();

  if (!session?.user?.twitchId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const twitchId = session.user.twitchId;
  const twitchLogin = session.user.login || session.user.name || 'unknown';

  console.log('→ /api/user/sync POST — начало для twitchId:', twitchId);

  // 1. Проверяем, есть ли уже профиль
  const { data: existing, error: checkError } = await supabaseAdmin
    .from('profiles')
    .select('points')
    .eq('twitch_id', twitchId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = "no rows" — норм
    console.error('Ошибка проверки профиля:', checkError);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }

  if (existing) {
    console.log('Профиль уже существует, points:', existing.points);
    return NextResponse.json({ success: true, points: existing.points });
  }

  // 2. Создаём новый профиль
  const { data: newProfile, error: insertError } = await supabaseAdmin
    .from('profiles')
    .insert({
      twitch_id: twitchId,
      twitch_login: twitchLogin,
      points: 0,
    })
    .select('points')
    .single();

  if (insertError) {
    console.error('Ошибка создания профиля:', insertError);
    return NextResponse.json({ error: 'Ошибка создания профиля' }, { status: 500 });
  }

  console.log('Профиль создан, points:', newProfile.points);
  return NextResponse.json({ success: true, points: newProfile.points });
}