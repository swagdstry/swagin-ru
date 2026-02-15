// app/api/telegram/webhook/route.ts
// Чистый webhook с принудительным nodejs runtime (Vercel edge ломается с grammy/supabase)

export const runtime = 'nodejs';       // ← КЛЮЧЕВОЕ: отключаем edge runtime
export const dynamic = 'force-dynamic'; // каждый запрос свежий, без кэша
export const maxDuration = 30;         // таймаут 30 секунд (на Vercel Hobby по умолчанию 10s)

import { NextRequest, NextResponse } from 'next/server';
import { Bot, webhookCallback } from 'grammy';

// Логируем при загрузке файла (проверяем, что Vercel вообще видит роут)
console.log('WEBHOOK ROUTE LOADED — файл успешно импортирован и готов к работе');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN НЕ НАЙДЕН В ENV VERCEL');
}

const bot = new Bot(token || 'dummy-test-token-do-not-use-in-prod');

bot.use(async (ctx, next) => {
  console.log('WEBHOOK: ПОЛУЧЕНО ОБНОВЛЕНИЕ ОТ TELEGRAM');
  console.log('Время:', new Date().toISOString());
  console.log('Update type:', Object.keys(ctx.update)[0]);
  console.log('From ID / username:', ctx.from?.id, ctx.from?.username || 'нет username');
  console.log('Chat ID / type:', ctx.chat?.id, ctx.chat?.type);
  console.log('Текст сообщения:', ctx.message?.text || 'нет текста');
  console.log('Match (если команда):', ctx.match || 'нет');
  console.log('Полный update (JSON):', JSON.stringify(ctx.update, null, 2));
  await next();
});

// Отвечаем на любое текстовое сообщение (для теста)
bot.on('message:text', async (ctx) => {
  console.log('WEBHOOK: ОБРАБОТЧИК ТЕКСТОВОГО СООБЩЕНИЯ СРАБОТАЛ');
  const text = ctx.message.text;
  const userId = ctx.from?.id || 'неизвестен';

  await ctx.reply(
    `Я получил твое сообщение!\n\n` +
    `Текст: "${text}"\n` +
    `Твой Telegram ID: ${userId}\n\n` +
    `Бот живой и работает на Vercel. Можно добавлять логику привязки по коду.`
  );
});

// Отдельный обработчик /start (чтобы ловить команды с параметрами)
bot.command('start', async (ctx) => {
  console.log('WEBHOOK: КОМАНДА /start СРАБОТАЛА');
  const code = ctx.match || 'кода нет';
  const userId = ctx.from?.id || 'неизвестен';

  await ctx.reply(
    `Команда /start получена!\n` +
    `Переданный код: ${code}\n` +
    `Твой Telegram ID: ${userId}\n\n` +
    `Если код из сайта — привязка должна пройти.`
  );
});

// Экспорт webhook
export const POST = webhookCallback(bot, 'std/http');

// Для проверки в браузере (GET должен вернуть 200)
export async function GET() {
  return new Response('Webhook активен. Отправляй POST от Telegram.', { status: 200 });
}