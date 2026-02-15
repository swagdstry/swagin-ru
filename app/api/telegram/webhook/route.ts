// app/api/telegram/webhook/route.ts
// Обязательно nodejs + force-dynamic — edge ломается с grammy

export const runtime = 'nodejs';
export const preferredRegion = 'auto'; // или 'iad1' / 'cle1' для твоего региона
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { Bot, webhookCallback } from 'grammy';

console.log('[Webhook] Route file LOADED at startup — file is imported');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('[Webhook] TELEGRAM_BOT_TOKEN missing in env');
}

const bot = new Bot(token || 'dummy-test-token');

bot.use(async (ctx, next) => {
  console.log('[Webhook] UPDATE RECEIVED — middleware triggered');
  console.log('Time:', new Date().toISOString());
  console.log('Update type:', Object.keys(ctx.update)[0]);
  console.log('From ID / username:', ctx.from?.id, ctx.from?.username);
  console.log('Message text:', ctx.message?.text);
  console.log('Full update:', JSON.stringify(ctx.update, null, 2));
  await next();
});

bot.on('message', async (ctx) => {
  console.log('[Webhook] MESSAGE HANDLER triggered');
  const text = ctx.message.text || '[no text]';
  await ctx.reply(`Получил: "${text}"\nТвой ID: ${ctx.from?.id || 'unknown'}`);
});

bot.command('start', async (ctx) => {
  console.log('[Webhook] /start command triggered');
  const code = ctx.match || 'no code';
  await ctx.reply(`/start с кодом "${code}"\nID: ${ctx.from?.id || 'unknown'}`);
});

export const POST = webhookCallback(bot, 'std/http', {
  secretToken: 'some-secret-if-want-security', // опционально, можно убрать
});

export async function GET() {
  return new Response('Webhook route is active (GET for test). Use POST from Telegram.', { status: 200 });
}