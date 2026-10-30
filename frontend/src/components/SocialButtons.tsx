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
      {(['kakao', 'github'] as const).map(
        (provider) =>
          providers?.[provider] && (
            <button
              key={provider}
              className="btn secondary full"
              onClick={() => void connect(provider)}
            >
              {provider === 'github' ? 'GitHub' : '카카오'}로 {link ? '계정 연결' : '계속하기'}
            </button>
          ),
      )}
      {providers && !providers.github && !providers.kakao && (
        <p className="text-xs text-fg-3">
          소셜 로그인은 현재 준비 중이에요. 이메일로 시작해 주세요.
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
