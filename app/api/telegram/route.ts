// app/api/telegram/webhook/route.ts

// Принудительно Node.js runtime (Vercel edge ломает grammy)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Импорты
import { NextRequest, NextResponse } from 'next/server';
import { Bot } from 'grammy';
import { webhookCallback } from 'grammy'; // ← явный импорт webhookCallback
import { supabaseAdmin } from '@/lib/supabase';

// Логируем загрузку
console.log('WEBHOOK ROUTE LOADED — файл импортирован');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN НЕ НАЙДЕН');
}

const bot = new Bot(token || 'dummy');

// Middleware: проверяем from безопасно
bot.use(async (ctx, next) => {
  console.log('WEBHOOK: Получено обновление');

  if (!ctx.from) {
    console.log('Update без from — игнорируем');
    return;
  }

  console.log('From ID:', ctx.from.id);
  console.log('Text:', ctx.message?.text || 'нет текста');

  await next();
});

// Обработчик /start
bot.command('start', async (ctx) => {
  if (!ctx.from) {
    await ctx.reply('Не удалось определить пользователя');
    return;
  }

  const code = ctx.match?.trim();

  if (!code) {
    await ctx.reply('Пришли /start с кодом из сайта');
    return;
  }

  console.log('Код:', code);

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('telegram_link_code', code)
    .maybeSingle();

  if (error) {
    console.error('Supabase error:', error);
    await ctx.reply('Ошибка сервера');
    return;
  }

  if (!profile) {
    await ctx.reply('Код недействителен');
    return;
  }

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      telegram_id: ctx.from.id, // ← здесь ctx.from гарантированно существует
      telegram_link_code: null,
    })
    .eq('id', profile.id);

  if (updateError) {
    console.error('Update error:', updateError);
    await ctx.reply('Ошибка привязки');
    return;
  }

  await ctx.reply('Привязка успешна! Вернись на сайт.');
});

// Экспорт webhook
export const POST = webhookCallback(bot, 'std/http');

// Для теста в браузере
export async function GET() {
  return new Response('Webhook активен', { status: 200 });
}