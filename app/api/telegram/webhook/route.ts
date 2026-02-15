// app/api/telegram/webhook/route.ts
export const runtime = 'nodejs'; 
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest } from 'next/server';
import { Bot, webhookCallback } from 'grammy';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN missing');
}

const bot = new Bot(token || 'dummy');

bot.use(async (ctx, next) => {
  console.log('=== RAW UPDATE FROM TELEGRAM ===');
  console.log('Update ID:', ctx.update.update_id);
  console.log('Full update:', JSON.stringify(ctx.update, null, 2));
  console.log('From:', ctx.from?.id, ctx.from?.username, ctx.from?.first_name);
  console.log('Chat:', ctx.chat?.id, ctx.chat?.type);
  console.log('Message text:', ctx.message?.text);
  console.log('Command match:', ctx.match);
  await next();
});

// Самый простой обработчик — ответ на любое сообщение
bot.on('message', async (ctx) => {
  console.log('Message handler triggered');
  const text = ctx.message.text || 'no text';
  await ctx.reply(`Я получил твое сообщение: "${text}"\nТвой ID: ${ctx.from?.id || 'unknown'}`);
});

// Отдельный /start
bot.command('start', async (ctx) => {
  console.log('/start triggered');
  const code = ctx.match || 'no code';
  await ctx.reply(`Команда /start с кодом: ${code}\nТвой ID: ${ctx.from?.id || 'unknown'}`);
});

export const POST = webhookCallback(bot, 'std/http');