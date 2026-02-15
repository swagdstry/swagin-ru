// app/api/user/profile/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.twitchId) {
    return NextResponse.json({ error: 'Не авторизован (нет twitchId)' }, { status: 401 });
  }

  const twitchId = session.user.twitchId;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('points, bonus_claimed, telegram_id')  // telegram_id тоже полезно
    .eq('twitch_id', twitchId)
    .maybeSingle();  // не падает при 0 строк

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: 'Ошибка Supabase' }, { status: 500 });
  }

  return NextResponse.json({
    points: data?.points ?? 0,
    bonus_claimed: data?.bonus_claimed ?? false,
    telegram_id: data?.telegram_id ?? null,
  });
}