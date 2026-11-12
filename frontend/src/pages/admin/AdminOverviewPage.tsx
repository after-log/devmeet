import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Flag, ShieldCheck } from 'lucide-react';
import { useAdminMock } from './hooks/useAdminMock';
import { Badge, EmptyState, PageHeading, Panel } from './components/AdminUI';
import OverviewStats from './components/OverviewStats';

export default function AdminOverviewPage() {
  const { members, reports, openReview, openReport } = useAdminMock();
  const pending = members.filter((m) => m.review === 'PENDING');
  const openReports = reports.filter((r) => r.status === 'OPEN');
  return (
    <>
      <PageHeading
        kicker="OVERVIEW"
        title={
          <>
            안녕하세요, 관리자님<span className="text-[#8c6bc9]">.</span>
          </>
        }
        description="오늘도 좋은 연결이 만들어지는 공간을 함께 살펴보세요."
      />
      <OverviewStats />
      <div className="my-[25px] flex items-center gap-[18px] rounded-[11px] border border-[#e6def3] bg-linear-to-br from-[#f0eafa] to-[#f6f3fc] p-6 max-[900px]:flex-wrap max-[900px]:gap-3 max-[900px]:p-[19px]">
        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#e8ddf7] text-[#9776ce]">
          <ShieldCheck size={26} />
        </div>
        <div className="max-sm:flex-1">
          <h3 className="text-sm font-semibold text-[#66517f] max-xl:text-xs max-sm:leading-relaxed">
            {pending.length
              ? `${pending.length}명의 프로필이 첫 만남을 기다리고 있어요`
              : '대기 중인 프로필 검수를 모두 마쳤어요'}
          </h3>
          <p className="mt-1! text-[11px] text-[#9a8bac] max-sm:text-[10px]">
            사진을 확인하고 회원들의 새로운 연결을 도와주세요.
          </p>
        </div>
        <Link
          className="ml-auto inline-flex min-h-[41px] items-center justify-center gap-2 rounded-[7px] border border-[#8664c7] bg-[#8664c7] px-[15px] py-2.5 text-xs font-medium whitespace-nowrap text-white hover:bg-[#7554b6] max-[900px]:ml-[60px]"
          to="/admin/profiles"
        >
          프로필 검수하기 <ArrowRight size={16} />
        </Link>
      </div>
      <div className="grid grid-cols-[1.1fr_1fr] gap-[23px] max-[900px]:grid-cols-1 max-xl:gap-[15px]">
        <Panel>
          <div className="flex items-center justify-between border-b border-[#f0f1f5] px-[23px] py-[21px]">
            <h2 className="text-[13px] font-semibold">
              최근 검수 대기{' '}
              <span className="ml-[7px] text-[11px] text-[#9a7acb]">{pending.length}</span>
            </h2>
            <Link
              className="flex items-center gap-[3px] text-[10px] text-[#9a9eab]"
              to="/admin/profiles"
            >
              전체 보기 <ChevronRight size={15} />
            </Link>
          </div>
          {pending.slice(0, 4).map((m) => (
            <button
              className="flex w-full items-center gap-3 border-0 border-b border-[#f1f2f6] bg-white px-[23px] py-[17px] text-left hover:bg-[#faf9fc]"
              key={m.id}
              onClick={() => openReview(m)}
            >
              <img
                className="h-[45px] w-[42px] rounded-[7px] object-cover"
                src={m.photos[0]}
                alt=""
              />
              <div className="flex-1">
                <strong className="block text-xs font-medium">{m.name}</strong>
                <small className="mt-1 block text-[10px] text-[#a0a4b1]">
                  {m.role} · {m.age}세
                </small>
              </div>
              <Badge status={m.review} />
              <ChevronRight size={16} className="ml-0.5 text-[#b4b6c1]" />
            </button>
          ))}
          {!pending.length && <EmptyState />}
        </Panel>
        <Panel>
          <div className="flex items-center justify-between border-b border-[#f0f1f5] px-[23px] py-[21px]">
            <h2 className="text-[13px] font-semibold">
              확인이 필요한 신고{' '}
              <span className="ml-[7px] text-[11px] text-[#9a7acb]">{openReports.length}</span>
            </h2>
            <Link
              className="flex items-center gap-[3px] text-[10px] text-[#9a9eab]"
              to="/admin/members?tab=reports"
            >
              전체 보기 <ChevronRight size={15} />
            </Link>
          </div>
          {openReports.map((r) => (
            <button
              className="flex w-full items-center gap-3 border-0 border-b border-[#f1f2f6] bg-white px-[23px] py-[22px] text-left hover:bg-[#faf9fc]"
              key={r.id}
              onClick={() => openReport(r)}
            >
              <span className="grid size-[35px] place-items-center rounded-[9px] bg-[#faf2ed] text-[#cda089]">
                <Flag size={17} />
              </span>
              <div className="flex-1">
                <strong className="block text-xs font-medium">{r.reason}</strong>
                <small className="mt-1 block text-[10px] text-[#a0a4b1]">
                  {r.sender} → {r.target} · {r.date.slice(5, 10)}
                </small>
              </div>
              <Badge status="OPEN" />
            </button>
          ))}
          {!openReports.length && <EmptyState />}
          <div className="mx-[23px] my-[17px] flex items-center gap-[7px] text-[10px] text-[#a5a8b4]">
            <ShieldCheck size={15} /> 신고 내용은 검토 후 신중하게 처리해 주세요.
          </div>
        </Panel>
      </div>
      <div className="mt-7 text-center text-[10px] text-[#aaadba]">
        작은 확인이 더 안전한 만남을 만듭니다.{' '}
        <span className="block font-mono text-[9px] leading-loose tracking-[0.7px] text-[#bdc0cb]">
          devmeet administration
        </span>
      </div>
    </>
  );
}
