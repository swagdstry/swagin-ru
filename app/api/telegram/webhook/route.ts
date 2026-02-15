// app/api/telegram/webhook/route.ts

// Обязательно для Vercel — отключаем edge runtime (grammy/supabase не дружат с ним)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // таймаут 30 секунд (на всякий случай)

import { NextRequest, NextResponse } from 'next/server';
import { Bot, webhookCallback } from 'grammy';

console.log('Webhook route LOADED at startup'); // проверяем, что файл вообще импортируется

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN не задан в env');
}

const bot = new Bot(token || 'dummy-for-logs');

bot.use(async (ctx, next) => {
  console.log('=== TELEGRAM UPDATE RECEIVED ===');
  console.log('Time:', new Date().toISOString());
  console.log('Update ID:', ctx.update.update_id);
  console.log('From:', ctx.from?.id, ctx.from?.username, ctx.from?.first_name);
  console.log('Chat ID / type:', ctx.chat?.id, ctx.chat?.type);
  console.log('Message text:', ctx.message?.text);
  console.log('Command match (если команда):', ctx.match);
  console.log('Full update (JSON):', JSON.stringify(ctx.update, null, 2));
  await next();
});

// Самый простой обработчик — ответ на ЛЮБОЕ сообщение
bot.on('message', async (ctx) => {
  console.log('Message handler triggered');
  const text = ctx.message.text || '[нет текста]';
  const userId = ctx.from?.id || 'unknown';
  
  await ctx.reply(
    `Я получил твое сообщение!\n\n` +
    `Текст: "${text}"\n` +
    `Твой ID: ${userId}\n\n` +
    `Всё работает, можно добавлять логику привязки :)`
  );
});

// Отдельный обработчик /start (на случай, если .on('message') не ловит команды)
bot.command('start', async (ctx) => {
  console.log('/start handler triggered');
  const code = ctx.match || 'кода нет';
  await ctx.reply(`Команда /start получена!\nКод: ${code}\nТвой ID: ${ctx.from?.id || 'unknown'}`);
});

export const POST = webhookCallback(bot, 'std/http');

// Для проверки в браузере
export async function GET() {
  return new Response('Webhook route active. Send POST from Telegram.', { status: 200 });
}