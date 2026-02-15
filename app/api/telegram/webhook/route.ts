// app/api/telegram/webhook/route.ts — минимальный рабочий webhook 2026

// 1. Заставляем Vercel использовать Node.js (edge ломается с grammy)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 секунд на обработку

// 2. Node.js-импорт — это сигнал Vercel'у: "я хочу Node.js!"
import { randomBytes } from 'crypto';
console.log('CRYPTO IMPORTED — Vercel использует nodejs runtime!');

import { NextRequest, NextResponse } from 'next/server';
import { Bot, webhookCallback } from 'grammy';

// Логируем загрузку файла
console.log('WEBHOOK FILE LOADED — роут импортирован');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN НЕТ В ENV');
}

const bot = new Bot(token || 'dummy');

bot.use(async (ctx, next) => {
  console.log('UPDATE RECEIVED — middleware сработал');
  console.log('Time:', new Date().toISOString());
  console.log('From ID:', ctx.from?.id || 'нет from');
  console.log('Text:', ctx.message?.text || 'нет текста');
  await next();
});

bot.on('message', async (ctx) => {
  console.log('MESSAGE HANDLER сработал');
  const text = ctx.message.text || '[нет текста]';
  await ctx.reply(`Я живой! Получил: "${text}"\nТвой ID: ${ctx.from?.id || 'неизвестен'}`);
});

bot.command('start', async (ctx) => {
  console.log('/start сработал');
  const code = ctx.match || 'кода нет';
  await ctx.reply(`/start! Код: ${code}\nID: ${ctx.from?.id || 'неизвестен'}`);
});

export const POST = webhookCallback(bot, 'std/http');

// Для теста в браузере
export async function GET() {
  return new Response('Webhook активен. POST от Telegram работает.', { status: 200 });
}