// app/auth/error/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
      <div className="text-center max-w-md bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-2xl">
        <h1 className="text-4xl font-bold text-red-500 mb-6">Ошибка авторизации</h1>

        {error === 'Configuration' && (
          <p className="text-xl text-zinc-300 mb-6">
            Проблема с конфигурацией сервера. Проверьте переменные окружения (NEXTAUTH_SECRET, NEXTAUTH_URL и другие).
          </p>
        )}

        {error === 'AccessDenied' && (
          <p className="text-xl text-zinc-300 mb-6">Доступ запрещён. Попробуйте войти заново.</p>
        )}

        {error && error !== 'Configuration' && error !== 'AccessDenied' && (
          <p className="text-xl text-zinc-300 mb-6">Ошибка: {error}</p>
        )}

        {!error && (
          <p className="text-xl text-zinc-300 mb-6">Неизвестная ошибка. Попробуйте позже.</p>
        )}

        <a
          href="/"
          className="inline-block mt-6 bg-[#9146FF] hover:bg-[#a76bff] text-white px-8 py-4 rounded-xl font-bold transition"
        >
          Вернуться на главную
        </a>
      </div>
    </div>
  );
}