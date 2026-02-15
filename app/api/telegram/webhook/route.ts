// app/api/telegram/webhook/route.ts

// Обязательно отключаем edge — Vercel по умолчанию использует его и ломает grammy
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // даём больше времени на обработку

import { NextRequest, NextResponse } from 'next/server';
import { Bot, webhookCallback } from 'grammy';

// Логируем при загрузке файла (проверяем, видит ли Vercel роут вообще)
console.log('WEBHOOK ROUTE LOADED — файл импортирован и функция готова');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN НЕ ЗАДАН В ENV VERCEL');
}

const bot = new Bot(token || 'dummy');

bot.use(async (ctx, next) => {
  console.log('WEBHOOK: Получено обновление от Telegram в', new Date().toISOString());
  console.log('Update type:', Object.keys(ctx.update)[0]);
  console.log('From:', ctx.from?.id, ctx.from?.username || 'аноним');
  console.log('Message text:', ctx.message?.text);
  console.log('Full update (short):', JSON.stringify(ctx.update, null, 2));
  await next();
});

// Отвечаем на любое сообщение (даже если не /start)
bot.on('message', async (ctx) => {
  console.log('WEBHOOK: Обработчик message сработал');
  const text = ctx.message.text || '[без текста]';
  await ctx.reply(`Я получил твое сообщение: "${text}"\nТвой ID: ${ctx.from?.id || 'неизвестен'}\n\nВсё работает!`);
});

// Отдельный обработчик /start
bot.command('start', async (ctx) => {
  console.log('WEBHOOK: /start сработал');
  const code = ctx.match || 'кода нет';
  await ctx.reply(`/start получен! Код: ${code}\nТвой ID: ${ctx.from?.id || 'неизвестен'}`);
});

export const POST = webhookCallback(bot, 'std/http');

// Для проверки в браузере (GET должен вернуть 200)
export async function GET() {
  return new Response('Webhook активен. Отправляй POST от Telegram.', { status: 200 });
}