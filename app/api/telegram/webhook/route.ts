// app/api/telegram/webhook/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('WEBHOOK POST RECEIVED AT', new Date().toISOString());
  console.log('Headers:', Object.fromEntries(request.headers.entries()));

  try {
    const body = await request.json();
    console.log('Received body:', JSON.stringify(body, null, 2));

    return NextResponse.json({
      ok: true,
      message: 'Webhook received! Your message was processed.',
      received: body
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}