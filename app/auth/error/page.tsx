// app/auth/error/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center p-8 bg-zinc-900 rounded-2xl border border-zinc-800 max-w-md">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Ошибка авторизации</h1>
        
        {error === 'Configuration' && (
          <p className="text-zinc-300 mb-6">
            Проблема с конфигурацией сервера. Проверьте NEXTAUTH_SECRET и NEXTAUTH_URL в переменных окружения.
          </p>
        )}

        {error === 'AccessDenied' && (
          <p className="text-zinc-300 mb-6">Доступ запрещён. Попробуйте войти заново.</p>
        )}

        {error && error !== 'Configuration' && error !== 'AccessDenied' && (
          <p className="text-zinc-300 mb-6">Ошибка: {error}</p>
        )}

        {!error && (
          <p className="text-zinc-300 mb-6">Неизвестная ошибка авторизации.</p>
        )}

        <a
          href="/"
          className="inline-block bg-[#9146FF] hover:bg-[#a76bff] text-white px-8 py-4 rounded-xl font-bold transition"
        >
          Вернуться на главную
        </a>
      </div>
    </div>
  );
}