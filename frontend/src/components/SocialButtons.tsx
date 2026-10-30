import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function SocialButtons({ link = false }: { link?: boolean }) {
  const [providers, setProviders] = useState<Record<'github' | 'kakao', boolean> | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void api
      .providers()
      .then((value) => {
        if (active) setProviders(value);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);
  const connect = async (provider: 'github' | 'kakao') => {
    try {
      const url = link ? (await api.link(provider)).url : '/oauth2/authorization/' + provider;
      window.location.assign(url);
    } catch (err) {
      toast((err as Error).message);
    }
  };
  return (
    <div className="mt-4 space-y-2">
      {(link ? (['kakao', 'github'] as const) : (['kakao'] as const)).map(
        (provider) =>
          providers?.[provider] && (
            <button
              key={provider}
              type="button"
              className={
                provider === 'kakao'
                  ? 'relative flex min-h-12 w-full items-center justify-center rounded-md bg-[#FEE500] px-12 py-3 text-[15px] font-semibold text-black/85 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FEE500]'
                  : 'btn secondary full'
              }
              onClick={() => void connect(provider)}
            >
              {provider === 'kakao' && (
                <svg
                  className="absolute left-5 h-5 w-5 text-black"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 3C5.925 3 1 6.82 1 11.532c0 3.067 2.085 5.755 5.215 7.26-.23.843-.832 3.055-.952 3.53-.148.588.216.58.454.422.187-.125 2.985-2.028 4.193-2.85.681.105 1.38.16 2.09.16 6.075 0 11-3.82 11-8.522S18.075 3 12 3Z" />
                </svg>
              )}
              {provider === 'kakao'
                ? link
                  ? '카카오 계정 연결'
                  : '카카오 로그인'
                : 'GitHub 계정 연결'}
            </button>
          ),
      )}
      {providers && !(link ? providers.github || providers.kakao : providers.kakao) && (
        <p className="text-xs text-fg-3">
          카카오 로그인은 현재 준비 중이에요. 잠시 후 다시 이용해 주세요.
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-orange">
          {error}
        </p>
      )}
    </div>
  );
}
