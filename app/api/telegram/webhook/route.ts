// app/api/telegram/webhook/route.ts
export const runtime = 'nodejs';      // <--- КЛЮЧЕВОЕ — отключаем edge
export const dynamic = 'force-dynamic';
export const maxDuration = 30;        // таймаут 30 секунд

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('WEBHOOK POST RECEIVED AT', new Date().toISOString());
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));

  try {
    const body = await request.json();
    console.log('Received Telegram update:', JSON.stringify(body, null, 2));

    // Возвращаем Telegram подтверждение (важно!)
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return new Response('Webhook route active. Use POST for Telegram updates.', { status: 200 });
}