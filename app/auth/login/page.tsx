'use client';

import { signIn } from "next-auth/react";
import { Twitch } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center p-10 bg-zinc-900 rounded-2xl border border-zinc-800 max-w-md w-full">
        <h1 className="text-4xl font-bold mb-6 text-[#9146FF]">Вход в swagin.ru</h1>
        <p className="text-zinc-400 mb-10">Авторизуйся через Twitch и получи доступ к предиктам, баллам и магазину</p>
        
        <button
          onClick={() => signIn("twitch", { callbackUrl: "/dashboard" })}
          className="w-full bg-[#9146FF] hover:bg-[#a76bff] text-white py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-[0_0_30px_rgba(145,70,255,0.6)]"
        >
          <Twitch className="w-8 h-8" />
          Войти через Twitch
        </button>
        
        <p className="mt-8 text-sm text-zinc-500">
          Мы не храним твои пароли. Только данные из Twitch.
        </p>
      </div>
    </div>
  );
}