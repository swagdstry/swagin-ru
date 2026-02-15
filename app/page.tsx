import Link from 'next/link';
import { Twitch } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-black flex items-center justify-center px-4 py-12">
      <div className="text-center max-w-4xl w-full">
        {/* Заголовок теперь с защитой от обрезки + responsive scaling */}
        <h1 
          className="
            text-5xl sm:text-6xl md:text-7xl lg:text-8xl 
            font-extrabold 
            mb-6 
            bg-gradient-to-r from-[#9146FF] via-[#c084fc] to-[#9146FF] 
            bg-clip-text text-transparent 
            leading-tight 
            tracking-tight
            animate-pulse-slow
          "
        >
          swagin.ru
        </h1>
        
        <p className="text-lg sm:text-xl md:text-2xl text-zinc-300 mb-10 md:mb-12 font-medium px-2">
          Предикты • Баллы • Магазин для настоящих swagdestroy-фанов
        </p>
        
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 justify-center items-center">
          {/* Кнопка "Смотреть стрим" */}
          <Link
            href="/stream"
            className="
              bg-white text-black 
              px-8 sm:px-10 py-4 sm:py-5 
              rounded-xl font-bold 
              text-base sm:text-lg 
              hover:scale-105 
              hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] 
              transition-all duration-300 
              shadow-lg
              w-full sm:w-auto
              text-center
            "
          >
            Смотреть стрим
          </Link>

          {/* Кнопка "Регистрация" в стиле Twitch */}
          <Link
            href="/auth/login"
            className="
              group relative 
              bg-[#9146FF] hover:bg-[#a76bff] 
              text-white 
              px-8 sm:px-10 py-4 sm:py-5 
              rounded-xl font-bold 
              text-base sm:text-lg 
              overflow-hidden 
              transition-all duration-300 
              shadow-[0_0_25px_rgba(145,70,255,0.5)] 
              hover:shadow-[0_0_45px_rgba(145,70,255,0.8)] 
              hover:scale-105 
              flex items-center justify-center gap-3
              w-full sm:w-auto
            "
          >
            <Twitch 
              className="w-6 h-6 sm:w-7 sm:h-7 group-hover:animate-bounce-twist transition-transform duration-500" 
            />
            Регистрация
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
          </Link>
        </div>

        <div className="mt-12 sm:mt-16 text-sm sm:text-base md:text-lg text-zinc-500 max-w-2xl mx-auto px-4">
          Авторизуйся через Twitch за 5 секунд и начинай зарабатывать баллы просто смотря трансляции swagdstry
        </div>
      </div>
    </div>
  );
}