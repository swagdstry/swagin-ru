// app/api/telegram/webhook/route.ts — чистый рабочий webhook 2026

// Обязательно отключаем edge runtime — Vercel по умолчанию использует его и ломает grammy/supabase
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // даём 30 секунд на обработку (Vercel Hobby лимит)

import { NextRequest, NextResponse } from 'next/server';
import { Bot, webhookCallback } from 'grammy';

console.log('WEBHOOK ROUTE LOADED — файл импортирован, функция готова к запуску');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN НЕ НАЙДЕН В ENV VERCEL');
}

const bot = new Bot(token || 'dummy');

bot.use(async (ctx, next) => {
  console.log('WEBHOOK UPDATE RECEIVED — middleware сработал');
  console.log('Time:', new Date().toISOString());
  console.log('Update type:', Object.keys(ctx.update)[0]);
  console.log('From ID / username:', ctx.from?.id, ctx.from?.username || 'нет');
  console.log('Message text:', ctx.message?.text || 'нет текста');
  console.log('Command match:', ctx.match || 'нет');
  await next();
});

// Простой ответ на любое сообщение (чтобы убедиться, что reply работает)
bot.on('message', async (ctx) => {
  console.log('MESSAGE HANDLER сработал');
  const text = ctx.message.text || '[нет текста]';
  await ctx.reply(
    `Получил: "${text}"\n` +
    `Твой ID: ${ctx.from?.id || 'неизвестен'}\n` +
    `Время: ${new Date().toISOString()}\n\n` +
    `Бот живой! Можно добавлять логику привязки.`
  );
});

// /start отдельно
bot.command('start', async (ctx) => {
  console.log('/start HANDLER сработал');
  const code = ctx.match || 'кода нет';
  await ctx.reply(
    `/start получен!\n` +
    `Код: ${code}\n` +
    `Твой ID: ${ctx.from?.id || 'неизвестен'}`
  );
});

export const POST = webhookCallback(bot, 'std/http');

// Для теста в браузере
export async function GET() {
  return new Response('Webhook активен (GET для теста). Отправляй POST от Telegram.', { status: 200 });
}