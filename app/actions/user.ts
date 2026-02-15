// actions/user.ts
'use server';

import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase'

export async function syncProfile() {
  const session = await auth();

  if (!session?.user?.twitchId) {
    throw new Error('Не авторизован');
  }

  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('twitch_id', session.user.twitchId)
    .single();

  if (existing) {
    return existing;
  }

  // Создаём нового
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .insert({
      twitch_id: session.user.twitchId,
      twitch_login: session.user.login || session.user.name,
      points: 0,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}