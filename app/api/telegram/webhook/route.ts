// app/api/telegram/webhook/route.ts

// 1. Принудительно Node.js runtime + Node.js-импорт (это заставляет Vercel использовать nodejs)
export const runtime = 'nodejs';
export const preferredRegion = 'auto';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Node.js-специфичный импорт — Vercel увидит и отключит edge
import { randomBytes } from 'crypto';
console.log('NODE.JS CRYPTO LOADED — runtime is nodejs!');

import { NextRequest, NextResponse } from 'next/server';
import { Bot, webhookCallback } from 'grammy';

console.log('WEBHOOK ROUTE LOADED — файл импортирован');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN MISSING');
}

const bot = new Bot(token || 'dummy');

bot.use(async (ctx, next) => {
  console.log('WEBHOOK UPDATE RECEIVED — middleware');
  console.log('Time:', new Date().toISOString());
  console.log('From ID:', ctx.from?.id);
  console.log('Text:', ctx.message?.text);
  await next();
});

bot.on('message', async (ctx) => {
  console.log('MESSAGE HANDLER triggered');
  await ctx.reply(`Получил: "${ctx.message.text || '[нет текста]'}"\nID: ${ctx.from?.id || 'неизвестен'}\nБот работает!`);
});

bot.command('start', async (ctx) => {
  console.log('/start triggered');
  const code = ctx.match || 'кода нет';
  await ctx.reply(`/start! Код: ${code}\nID: ${ctx.from?.id || 'неизвестен'}`);
});

export const POST = webhookCallback(bot, 'std/http');

export async function GET() {
  return new Response('Webhook active. POST from Telegram works.', { status: 200 });
}