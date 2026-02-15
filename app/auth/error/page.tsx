// app/auth/error/page.tsx
'use client'; // ← Обязательно клиентский компонент!

import { useSearchParams } from 'next/navigation';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-zinc-950 text-white p-6">
      <div className="text-center max-w-lg bg-zinc-900/80 backdrop-blur-xl p-10 rounded-3xl border border-zinc-700/50 shadow-2xl">
        <h1 className="text-5xl font-bold text-red-500 mb-6">Ошибка авторизации</h1>

        {error === 'Configuration' && (
          <div className="space-y-4">
            <p className="text-xl text-zinc-300">
              Проблема с конфигурацией сервера. Самые частые причины:
            </p>
            <ul className="text-left text-zinc-400 space-y-2 list-disc pl-6">
              <li>NEXTAUTH_SECRET отсутствует или слишком короткий (нужно минимум 32 символа)</li>
              <li>NEXTAUTH_URL неверный (должен быть https://ваш-домен.vercel.app)</li>
              <li>Twitch app не имеет нужных scope (channel:read:subscriptions)</li>
            </ul>
            <p className="text-zinc-400 mt-4">
              Проверьте Environment Variables в Vercel и redeploy.
            </p>
          </div>
        )}

        {error === 'AccessDenied' && (
          <p className="text-xl text-zinc-300 mb-6">Доступ запрещён. Попробуйте войти заново или проверьте права в Twitch.</p>
        )}

        {error && error !== 'Configuration' && error !== 'AccessDenied' && (
          <p className="text-xl text-zinc-300 mb-6">Ошибка: {error}</p>
        )}

        {!error && (
          <p className="text-xl text-zinc-300 mb-6">Неизвестная ошибка авторизации. Попробуйте позже.</p>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/"
            className="bg-[#9146FF] hover:bg-[#a76bff] text-white px-8 py-4 rounded-xl font-bold transition"
          >
            На главную
          </a>
          <a
            href="/auth/login"
            className="bg-zinc-700 hover:bg-zinc-600 text-white px-8 py-4 rounded-xl font-bold transition"
          >
            Попробовать войти снова
          </a>
        </div>
      </div>
    </div>
  );
}