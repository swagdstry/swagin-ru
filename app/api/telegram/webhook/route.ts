import { NextRequest, NextResponse } from 'next/server';
import { Bot, webhookCallback } from 'grammy';
import { supabaseAdmin } from '@/lib/supabase';
export const dynamic = 'force-dynamic'; 
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN не задан');

const bot = new Bot(token);

// Глобальный guard (опционально)
bot.use(async (ctx, next) => {
  if (!ctx.from) {
    console.log('Update без from:', JSON.stringify(ctx.update, null, 2));
    return;
  }
  await next();
});

// /start handler
bot.command('start', async (ctx) => {
  const code = ctx.match;

  if (!ctx.from) {
    await ctx.reply('Эта команда работает только от реального пользователя.');
    return;
  }

  if (!code) {
    await ctx.reply('Используй ссылку из сайта для привязки аккаунта!');
    return;
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('telegram_link_code', code)
    .single();

  if (error || !profile) {
    await ctx.reply('Неверный или истёкший код. Сгенерируй новый на сайте.');
    return;
  }

  const { error: updateErr } = await supabaseAdmin
    .from('profiles')
    .update({
      telegram_id: ctx.from.id,
      telegram_link_code: null,
    })
    .eq('id', profile.id);

  if (updateErr) {
    console.error(updateErr);
    await ctx.reply('Ошибка сервера. Попробуй позже.');
    return;
  }

  await ctx.reply(
    `Привязка успешна, ${ctx.from.first_name || 'путешественник'}!\n` +
    'Вернись на сайт и забери +15 баллов за подписку на канал.'
  );
});

bot.on('message:text', async (ctx) => {
  if (!ctx.from) return;
  await ctx.reply('Просто используй ссылку из сайта для привязки :)');
});

// Webhook
export const POST = webhookCallback(bot, 'std/http');