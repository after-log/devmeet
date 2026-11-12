import { Flag, Image, SlidersHorizontal, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminMock } from '../hooks/useAdminMock';

export default function OverviewStats() {
  const { members, reports, questions } = useAdminMock();
  const stats = [
    {
      label: '전체 가입 회원',
      value: members.length,
      unit: '명',
      icon: Users,
      sub: '프로필 등록 회원',
      tone: 'bg-neutral-100 text-neutral-700',
    },
    {
      label: '프로필 검수 대기',
      value: members.filter((m) => m.review === 'PENDING').length,
      unit: '건',
      icon: Image,
      sub: '검수가 필요한 프로필',
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: '미처리 신고',
      value: reports.filter((r) => r.status === 'OPEN').length,
      unit: '건',
      icon: Flag,
      sub: '확인이 필요한 신고',
      tone: 'bg-orange-50 text-orange-700',
    },
    {
      label: '활성 가치관 문항',
      value: questions.filter((q) => q.active).length,
      unit: '개',
      icon: SlidersHorizontal,
      sub: `전체 ${questions.length}개 문항`,
      tone: 'bg-emerald-50 text-emerald-700',
    },
  ];
  return (
    <div className="grid grid-cols-4 gap-[17px] max-[900px]:grid-cols-2 max-xl:gap-3 max-sm:gap-2.5">
      {stats.map(({ label, value, unit, icon: Icon, sub, tone }) => (
        <div
          className="rounded-[11px] border border-[#e5e5e5] bg-white px-[22px] pt-[21px] pb-[17px] shadow-[0_2px_3px_#26262602] max-xl:p-4 max-sm:p-[15px]"
          key={label}
        >
          <div className="flex items-center justify-between text-[13px] text-neutral-600 max-sm:text-[12px]">
            <span>{label}</span>
            <span
              className={cn(
                'grid size-[33px] place-items-center rounded-[9px] max-sm:size-[27px]',
                tone,
              )}
            >
              <Icon size={18} />
            </span>
          </div>
          <strong className="mt-[9px] block text-[32px] leading-snug font-semibold tracking-[-1.2px] max-sm:text-[29px]">
            {value}
            <small className="ml-1.5 text-sm font-normal text-neutral-600">{unit}</small>
          </strong>
          <p className="mt-2! text-[12px] text-neutral-600">{sub}</p>
        </div>
      ))}
    </div>
  );
}
