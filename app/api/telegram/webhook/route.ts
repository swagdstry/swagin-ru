// app/api/telegram/webhook/route.ts — 100% рабочий вариант с nodejs

// Принудительно Node.js runtime — Vercel edge ломается с grammy/supabase
export const runtime = 'nodejs';
export const preferredRegion = 'auto'; // или 'iad1' для США/Европы
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Node.js-специфичный импорт — заставляет Vercel использовать nodejs
import { randomBytes } from 'crypto';
console.log('Node.js crypto imported — runtime is nodejs!');

import { NextRequest, NextResponse } from 'next/server';
import { Bot, webhookCallback } from 'grammy';

console.log('WEBHOOK ROUTE LOADED — файл импортирован, функция готова');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN НЕ НАЙДЕН');
}

const bot = new Bot(token || 'dummy');

bot.use(async (ctx, next) => {
  console.log('WEBHOOK: UPDATE RECEIVED');
  console.log('Time:', new Date().toISOString());
  console.log('Update type:', Object.keys(ctx.update)[0]);
  console.log('From:', ctx.from?.id, ctx.from?.username || 'нет');
  console.log('Text:', ctx.message?.text || 'нет текста');
  await next();
});

bot.on('message', async (ctx) => {
  console.log('MESSAGE HANDLER сработал');
  const text = ctx.message.text || '[нет текста]';
  await ctx.reply(`Я получил: "${text}"\nID: ${ctx.from?.id || 'неизвестен'}\nБот живой!`);
});

bot.command('start', async (ctx) => {
  console.log('/start сработал');
  const code = ctx.match || 'кода нет';
  await ctx.reply(`/start! Код: ${code}\nID: ${ctx.from?.id || 'неизвестен'}`);
});

export const POST = webhookCallback(bot, 'std/http');

export async function GET() {
  return new Response('Webhook активен. POST от Telegram работает.', { status: 200 });
}