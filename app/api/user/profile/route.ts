// app/api/user/profile/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  console.log('ЗАПРОС /api/user/profile ПОЛУЧЕН');

  const session = await auth();
  console.log('Сессия:', session ? 'есть' : 'NULL');
  console.log('twitchId:', session?.user?.twitchId || 'ОТСУТСТВУЕТ');

  if (!session?.user?.twitchId) {
    console.log('Нет twitchId → 401');
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const twitchId = session.user.twitchId;
  const twitchLogin = session.user.login || session.user.name || 'unknown';

  let { data, error } = await supabaseAdmin
    .from('profiles')
    .select('points')
    .eq('twitch_id', twitchId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Supabase ошибка поиска:', error.message);
    return NextResponse.json({ points: 0 });
  }

  if (!data) {
    console.log('Профиль не найден — СОЗДАЁМ');

    const { data: newProfile, error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        twitch_id: twitchId,
        twitch_login: twitchLogin,
        points: 0,
        role: 'user',
      })
      .select('points')
      .single();

    if (insertError) {
      console.error('ОШИБКА СОЗДАНИЯ:', insertError.message, insertError.details || '');
      return NextResponse.json({ points: 0 });
    }

    console.log('ПРОФИЛЬ СОЗДАН:', newProfile);
    data = newProfile;
  }

  console.log('УСПЕХ — баллы:', data?.points ?? 0);
  return NextResponse.json({ points: data?.points ?? 0 });
}