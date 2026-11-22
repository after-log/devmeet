import { useEffect, useState } from 'react';
import { Heart, MessageCircle, UserPlus, Users, RefreshCw } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { adminApi, adminDate } from '../api';
import { useAdmin } from '../hooks/useAdmin';
import type { AdminStatistics } from '../types';

const number = new Intl.NumberFormat('ko-KR');
const axis = { tickLine: false, axisLine: false, tick: { fill: '#737373', fontSize: 12 } };
const tooltipStyle = { border: '1px solid #e5e5e5', borderRadius: 10, fontSize: 13 };

export default function UserStatistics() {
  const { loading: refreshing } = useAdmin();
  const [days, setDays] = useState<7 | 30>(30);
  const [data, setData] = useState<AdminStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null);
    setLoading(true);
    setError('');
    if (!refreshing) {
      adminApi
        .statistics(days)
        .then((result) => {
          if (active) setData(result);
        })
        .catch((error: unknown) => {
          if (active)
            setError(error instanceof Error ? error.message : '통계를 불러오지 못했어요.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [days, refreshing, retry]);

  const sum = (key: 'signups' | 'likes' | 'matches' | 'messages') =>
    data?.daily.reduce((total, day) => total + day[key], 0) ?? 0;
  const cards = [
    {
      label: '신규 가입자',
      value: sum('signups'),
      unit: '명',
      icon: UserPlus,
      color: 'text-indigo-600 bg-indigo-50',
      sub: '기간 내 가입한 회원',
    },
    {
      label: '보낸 좋아요',
      value: sum('likes'),
      unit: '건',
      icon: Heart,
      color: 'text-rose-600 bg-rose-50',
      sub: '기간 내 전송된 좋아요',
    },
    {
      label: '신규 매칭',
      value: sum('matches'),
      unit: '건',
      icon: Users,
      color: 'text-emerald-700 bg-emerald-50',
      sub: '서로 좋아요를 보낸 연결',
    },
    {
      label: '대화 참여자',
      value: data?.chatParticipants ?? 0,
      unit: '명',
      icon: MessageCircle,
      color: 'text-sky-700 bg-sky-50',
      sub: '메시지를 보낸 회원 · 중복 제외',
    },
  ];
  const chartData =
    data?.daily.map((day) => ({ ...day, label: day.date.slice(5).replace('-', '.') })) ?? [];
  const hasActivity = sum('likes') + sum('matches') + sum('messages') > 0;
  return (
    <section className="mb-8" aria-labelledby="user-statistics-title" aria-busy={loading}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id="user-statistics-title" className="text-xl font-semibold">
            유저 통계
          </h1>
          <p className="mt-1! text-sm text-neutral-600">
            가입부터 새로운 연결까지, 회원들의 활동을 확인하세요.
          </p>
        </div>
        <div
          className="inline-flex gap-1 rounded-lg border border-neutral-200 bg-white p-1"
          aria-label="통계 조회 기간"
        >
          {([7, 30] as const).map((period) => (
            <button
              key={period}
              type="button"
              aria-pressed={days === period}
              onClick={() => setDays(period)}
              className={`rounded-md px-3 py-2 text-sm font-medium ${days === period ? 'bg-neutral-800 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              최근 {period}일
            </button>
          ))}
        </div>
      </div>
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
        >
          {error}
          <button
            type="button"
            className="ml-3 underline"
            onClick={() => setRetry((value) => value + 1)}
          >
            다시 불러오기
          </button>
        </div>
      ) : loading || !data ? (
        <div
          role="status"
          className="flex h-48 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-600"
        >
          <RefreshCw size={16} className="animate-spin motion-reduce:animate-none" /> 통계를
          불러오는 중…
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap justify-between gap-2 text-xs text-neutral-500">
            <span>
              {data.daily[0]?.date.replaceAll('-', '.')} –{' '}
              {data.daily.at(-1)?.date.replaceAll('-', '.')} · 한국 시간 · 오늘은 현재까지 집계
            </span>
            <span>{adminDate(data.updatedAt, true)} 업데이트</span>
          </div>
          <div className="mb-5 grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2">
            {cards.map(({ label, value, unit, icon: Icon, color, sub }) => (
              <div
                key={label}
                className="rounded-xl border border-neutral-200 bg-white p-5 max-sm:p-4"
              >
                <div className="flex items-center justify-between gap-2 text-sm text-neutral-600">
                  {label}
                  <span className={`rounded-lg p-2 ${color}`}>
                    <Icon size={17} />
                  </span>
                </div>
                <p className="mt-3! text-3xl font-semibold tracking-tight tabular-nums">
                  {number.format(value)}
                  <span className="ml-1.5 text-sm font-normal text-neutral-500">{unit}</span>
                </p>
                <p className="mt-2! text-xs text-neutral-500">{sub}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-5 max-[1100px]:grid-cols-1">
            <div className="min-w-0 rounded-xl border border-neutral-200 bg-white p-5 max-sm:p-3">
              <h2 className="text-sm font-semibold">신규 가입 추이</h2>
              <p className="mt-1! mb-5! text-xs text-neutral-500">
                일별 신규 가입 회원 수{sum('signups') === 0 && ' · 기간 내 신규 가입이 없습니다.'}
              </p>
              <ResponsiveContainer width="100%" height={250} minWidth={0}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 8, left: -25, bottom: 0 }}
                  accessibilityLayer
                >
                  <defs>
                    <linearGradient id="admin-signups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="label" {...axis} minTickGap={24} />
                  <YAxis {...axis} allowDecimals={false} domain={[0, 'auto']} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(_, items) => items[0]?.payload?.date ?? ''}
                  />
                  <Area
                    type="linear"
                    dataKey="signups"
                    name="신규 가입자 (명)"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#admin-signups)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="min-w-0 rounded-xl border border-neutral-200 bg-white p-5 max-sm:p-3">
              <h2 className="text-sm font-semibold">좋아요 · 매칭 · 대화 추이</h2>
              <p className="mt-1! mb-5! text-xs text-neutral-500">
                일별 활동 건수 · 메시지 총 {number.format(sum('messages'))}건
                {!hasActivity && ' · 기간 내 활동이 없습니다.'}
              </p>
              <ResponsiveContainer width="100%" height={250} minWidth={0}>
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 8, left: -25, bottom: 0 }}
                  accessibilityLayer
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="label" {...axis} minTickGap={24} />
                  <YAxis {...axis} allowDecimals={false} domain={[0, 'auto']} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(_, items) => items[0]?.payload?.date ?? ''}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                  <Line
                    type="linear"
                    dataKey="likes"
                    name="좋아요"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="linear"
                    dataKey="matches"
                    name="매칭"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="linear"
                    dataKey="messages"
                    name="메시지"
                    stroke="#0284c7"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="mt-3! text-xs text-neutral-500">
            재방문 사용자와 실제 이용 시간은 아직 집계되지 않습니다.
          </p>
        </>
      )}
      <h2 className="mt-8! mb-4! text-base font-semibold">운영 현황</h2>
    </section>
  );
}
