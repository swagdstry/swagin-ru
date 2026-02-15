'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { LogOut, Coins, Trophy, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { checkSubscription } from '@/app/actions/subscription';
import { claimBonus } from '@/app/actions/claimBonus';      // ← новый action
import { generateTelegramLink } from '@/app/actions/generateTelegramLink'; // ← новый action

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const [points, setPoints] = useState<number | null>(null);
  const [bonusClaimed, setBonusClaimed] = useState<boolean>(false);
  const [telegramId, setTelegramId] = useState<string | null>(null); // для проверки привязки
  const [subStatus, setSubStatus] = useState<{
    subscribed: boolean;
    tier?: string;
    isGift?: boolean;
  } | null>(null);
  const [twitchProfile, setTwitchProfile] = useState<{
    avatar: string;
    banner?: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [linkLoading, setLinkLoading] = useState(false);
  const [linkData, setLinkData] = useState<{ link?: string; message?: string } | null>(null);

  const [claimLoading, setClaimLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    } else if (status !== 'loading') {
      setLoading(false);
    }
  }, [status, session]);

  const loadData = async () => {
    if (!session?.user) {
      setError('Сессия не активна');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Профиль (баллы + bonus_claimed + telegram_id)
      const profileRes = await fetch('/api/user/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setPoints(profileData.points ?? 0);
        setBonusClaimed(profileData.bonus_claimed ?? false);
        setTelegramId(profileData.telegram_id ?? null); // добавь в /api/user/profile select telegram_id
      } else {
        setPoints(0);
        setBonusClaimed(false);
        setTelegramId(null);
      }

      // 2. Подписка Twitch
      const subData = await checkSubscription();
      setSubStatus(subData || { subscribed: false });

      // 3. Профиль Twitch
      const twitchId = session.user.twitchId;
      const accessToken = session.user.accessToken;
      const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;

      if (twitchId && accessToken && clientId) {
        const twitchRes = await fetch(
          `https://api.twitch.tv/helix/users?id=${twitchId}`,
          {
            headers: {
              'Client-Id': clientId,
              Authorization: `Bearer ${accessToken}`,
            },
            cache: 'no-store',
          }
        );

        if (twitchRes.ok) {
          const twitchData = await twitchRes.json();
          const user = twitchData.data?.[0];
          if (user) {
            setTwitchProfile({
              avatar: user.profile_image_url || '/default-avatar.png',
              banner: user.offline_image_url || user.profile_image_url || session.user.image || '/default-avatar.png',
            });
          }
        }
      }

      // Fallback
      setTwitchProfile({
        avatar: session.user.image || '/default-avatar.png',
        banner: session.user.image || '/default-avatar.png',
      });
    } catch (err: any) {
      console.error('Ошибка загрузки данных:', err);
      setError(err.message || 'Не удалось загрузить данные');
      setPoints(0);
      setBonusClaimed(false);
      setTelegramId(null);
      setSubStatus({ subscribed: false });
      setTwitchProfile({
        avatar: session?.user?.image || '/default-avatar.png',
        banner: session?.user?.image || '/default-avatar.png',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    setLinkLoading(true);
    setLinkData(null);
    try {
      const result = await generateTelegramLink();
      if (result.success && result.link) {
        setLinkData({ link: result.link });
      } else {
        setError(result.message || 'Не удалось сгенерировать ссылку');
      }
    } catch (err) {
      setError('Ошибка при генерации ссылки');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleClaimBonus = async () => {
    setClaimLoading(true);
    try {
      const result = await claimBonus();
      if (result.success) {
        setPoints(result.newPoints);
        setBonusClaimed(true);
        alert(result.message || 'Бонус получен!');
      } else {
        alert(result.message || 'Не удалось получить бонус');
      }
    } catch (err) {
      alert('Произошла ошибка');
    } finally {
      setClaimLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#9146FF] text-2xl animate-pulse">Загрузка...</div>
      </div>
    );
  }

  if (status !== 'authenticated' || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-6">
        <div className="text-3xl text-white">Требуется авторизация</div>
        <Link
          href="/auth/login"
          className="bg-[#9146FF] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#a76bff] transition"
        >
          Войти через Twitch
        </Link>
      </div>
    );
  }

  const avatar = twitchProfile?.avatar || session.user.image || '/default-avatar.png';
  const banner = twitchProfile?.banner || avatar;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Профиль */}
        <Link href="/profile" className="block group relative">
          <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden shadow-2xl border border-white/10 hover:border-[#9146FF]/60 transition-all duration-300">
            <div
              className="absolute inset-0 bg-cover bg-center scale-110 group-hover:scale-115 transition-transform duration-700"
              style={{
                backgroundImage: `url(${banner})`,
                filter: 'blur(16px) brightness(0.55)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black/90" />

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = '/api/auth/signout';
              }}
              className="absolute top-4 right-4 z-20 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm border border-white/10 hover:border-red-500/50"
              title="Выйти"
            >
              <LogOut size={20} />
            </button>

            <div className="absolute inset-0 flex items-center px-6 md:px-12">
              <div className="flex items-center gap-6 w-full">
                <div className="relative flex-shrink-0">
                  <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl group-hover:border-[#9146FF] group-hover:border-4 transition-all duration-300">
                    <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-3xl md:text-4xl font-bold text-white truncate">
                      {session.user.displayName || session.user.login || 'Twitch User'}
                    </h2>
                    <div className="bg-gradient-to-r from-[#9146FF] to-[#c084fc] text-white text-xs md:text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                      <span>★</span> SWAG
                    </div>
                  </div>
                  <p className="text-zinc-400 text-lg md:text-xl mt-1">
                    @{session.user.login || 'username'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <div className="bg-zinc-800/80 text-zinc-300 text-xs px-3 py-1 rounded-full border border-zinc-700">
                      Подписчик
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Карточки */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-[#9146FF]/50 transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Баллы</h3>
              <Coins className="text-[#9146FF]" size={28} />
            </div>
            <div className="text-5xl font-bold text-[#9146FF]">
              {points !== null ? points.toLocaleString() : '...'}
            </div>
            <p className="text-zinc-500 mt-2">1 балл = 8 ₽</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-[#9146FF]/50 transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Подписка</h3>
              <Trophy className="text-yellow-500" size={28} />
            </div>
            <div className="text-3xl font-bold mt-4">
              {subStatus?.subscribed ? 'Активна' : 'Нет'}
            </div>
            {subStatus?.subscribed && (
              <p className="text-zinc-400 mt-1">
                Tier: {subStatus.tier || '?'} {subStatus.isGift ? '(подарок)' : ''}
              </p>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-[#9146FF]/50 transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Магазин</h3>
              <ShoppingBag className="text-green-400" size={28} />
            </div>
            <Link
              href="/shop"
              className="mt-4 inline-block bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-medium transition"
            >
              Перейти
            </Link>
          </div>
        </div>

        {/* Бонус блок */}
        <div className="mt-10 bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Получи +15 баллов бесплатно</h2>

          <div className="bg-zinc-800 p-6 rounded-xl">
            <h3 className="text-xl mb-4">Подпишись на Telegram-канал</h3>

            <a
              href="https://t.me/swagdestroy"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl inline-block transition mb-4"
            >
              Перейти в канал
            </a>

            <p className="text-zinc-400 mb-6">
              После подписки привяжи аккаунт и нажми кнопку ниже — система проверит и начислит баллы.
            </p>

            {!telegramId ? (
              <div>
                <button
                  onClick={handleGenerateLink}
                  disabled={linkLoading}
                  className={`px-8 py-4 rounded-xl font-bold w-full transition ${
                    linkLoading
                      ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                      : 'bg-yellow-600 hover:bg-yellow-500 text-white'
                  }`}
                >
                  {linkLoading ? 'Генерация...' : 'Привязать Telegram'}
                </button>

                {linkData?.link && (
                  <div className="mt-4 p-4 bg-zinc-900 rounded-lg border border-zinc-700">
                    <p className="text-zinc-300 mb-2">Перейди по этой ссылке в Telegram:</p>
                    <a
                      href={linkData.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#9146FF] hover:underline break-all"
                    >
                      {linkData.link}
                    </a>
                    <p className="text-sm text-zinc-500 mt-2">
                      После перехода бот подтвердит привязку — вернись сюда и нажми «Проверить подписку».
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleClaimBonus}
                disabled={claimLoading || bonusClaimed}
                className={`px-8 py-4 rounded-xl font-bold w-full transition ${
                  bonusClaimed || claimLoading
                    ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                    : 'bg-[#9146FF] hover:bg-[#a76bff] text-white'
                }`}
              >
                {claimLoading
                  ? 'Проверка подписки...'
                  : bonusClaimed
                  ? 'Бонус получен'
                  : 'Проверить подписку и получить +15'}
              </button>
            )}
          </div>

          {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}