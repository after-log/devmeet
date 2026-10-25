import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useApp } from '../stores/app';
import { api } from '../lib/mock-api';
import { REPORT_REASONS } from '../data/options';
import type { Person } from '../types';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { Select } from './ui/select';

const FiltersSheet = ({ close }: { close: () => void }) => {
  const { user, demo, draft, setDraft, setUser } = useApp();
  const p = user?.profile ?? draft;
  const [region, setRegion] = useState(p.region ?? '');
  const [minAge, setMinAge] = useState(String(p.minAge ?? 19));
  const [maxAge, setMaxAge] = useState(String(p.maxAge ?? 60));
  const save = async () => {
    if (Number(minAge) > Number(maxAge)) return toast('최소 나이는 최대 나이보다 작아야 해요.');
    const patch = { region, minAge: Number(minAge), maxAge: Number(maxAge) };
    if (demo || !user?.profile) setDraft(patch);
    else {
      const { profile } = await api.saveProfile({ ...user.profile, ...patch });
      setUser({ ...user, profile });
    }
    close();
    toast('추천 조건을 저장했어요.');
  };
  return (
    <>
      <p className="eyebrow">// preferences</p>
      <DialogTitle>추천 조건</DialogTitle>
      <label className="formlabel" htmlFor="filter-region">
        지역
      </label>
      <Select
        id="filter-region"
        value={region || 'all'}
        onValueChange={(v) => setRegion(v === 'all' ? '' : v)}
        options={[
          { value: 'all', label: '서울·경기 전체' },
          { value: '서울', label: '서울시' },
          { value: '경기', label: '경기도' },
        ]}
      />
      <div className="grid grid-cols-2 gap-2">
        <label className="formlabel">
          최소 나이
          <input
            className="mt-2"
            type="number"
            min={19}
            max={80}
            value={minAge}
            onChange={(e) => setMinAge(e.target.value)}
          />
        </label>
        <label className="formlabel">
          최대 나이
          <input
            className="mt-2"
            type="number"
            min={19}
            max={80}
            value={maxAge}
            onChange={(e) => setMaxAge(e.target.value)}
          />
        </label>
      </div>
      <DialogDescription className="secure mt-[22px]">
        변경한 조건은 다음 날 새 추천에 적용돼요.
        <br />
        오늘 이미 배정된 인연은 유지돼요.
      </DialogDescription>
      <button className="btn full" onClick={save}>
        조건 저장
      </button>
    </>
  );
};

const SafetySheet = ({ id, close }: { id: string; close: () => void }) => {
  const navigate = useNavigate();
  const { demo, demoBlock, openSheet, refresh } = useApp();
  return (
    <>
      <p className="eyebrow">// safety</p>
      <DialogTitle>대화 · 프로필 관리</DialogTitle>
      <DialogDescription>개인 연락처와 금융 정보는 신중하게 공유해 주세요.</DialogDescription>
      <button className="btn secondary full" onClick={() => openSheet({ kind: 'report', id })}>
        신고하기
      </button>
      <button
        className="btn secondary mt-[10px] w-full"
        onClick={async () => {
          if (demo) demoBlock(id);
          else {
            await api.block(id);
            await refresh();
          }
          close();
          navigate('/chat');
          toast('차단했어요. 추천과 대화 목록에서 서로 보이지 않아요.');
        }}
      >
        차단하기
      </button>
      <p className="footnote">차단하면 추천과 대화 목록에서 서로 보이지 않아요.</p>
    </>
  );
};

const ReportSheet = ({ id, close }: { id: string; close: () => void }) => {
  const demo = useApp((s) => s.demo);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  return (
    <>
      <p className="eyebrow">// report</p>
      <DialogTitle>신고 접수</DialogTitle>
      <label className="formlabel" htmlFor="report-reason">
        어떤 문제가 있었나요?
      </label>
      <Select
        id="report-reason"
        value={reason}
        onValueChange={setReason}
        options={REPORT_REASONS}
      />
      <button
        className="btn full"
        onClick={async () => {
          close();
          if (demo) return toast('둘러보기에서는 실제 신고가 접수되지 않아요.');
          const r = await api.report(id, reason);
          toast(`신고를 기록했어요 · ${r.id.slice(0, 8)}`);
        }}
      >
        신고 기록하기
      </button>
      <p className="footnote">
        서버 연동 전이라 이 브라우저에만 기록돼요. 운영자 검토는 아직 없어요.
      </p>
    </>
  );
};

const BlockedSheet = () => {
  const demo = useApp((s) => s.demo);
  const refresh = useApp((s) => s.refresh);
  const [people, setPeople] = useState<Person[] | null>(null);
  const load = () => {
    if (demo) setPeople([]);
    else void api.blocks().then((r) => setPeople(r.people));
  };
  useEffect(load, [demo]);
  return (
    <>
      <p className="eyebrow">// blocked</p>
      <DialogTitle>차단한 프로필</DialogTitle>
      {people === null ? (
        <p className="muted">불러오는 중…</p>
      ) : people.length ? (
        people.map((p) => (
          <div className="settings-row items-center" key={p.id}>
            {p.name}, {p.age}
            <button
              className="tag"
              onClick={async () => {
                await api.block(p.id, true);
                await refresh();
                load();
                toast('차단을 해제했어요.');
              }}
            >
              차단 해제
            </button>
          </div>
        ))
      ) : (
        <p className="muted">차단한 프로필이 없어요.</p>
      )}
    </>
  );
};

const InfoSheet = ({ kind }: { kind: 'social' | 'privacy' }) =>
  kind === 'social' ? (
    <>
      <p className="eyebrow">// auth.providers</p>
      <DialogTitle>카카오 · GitHub 연결 안내</DialogTitle>
      <DialogDescription>
        카카오 로그인과 GitHub 계정 소유 확인은 서비스 앱 키를 등록한 뒤 제공돼요.
      </DialogDescription>
      <p className="muted">
        지금은 이메일과 비밀번호로 가입할 수 있어요. GitHub 연결·회사 재직·사진 검토가 끝난 것처럼
        표시하지 않아요.
      </p>
    </>
  ) : (
    <>
      <p className="eyebrow">// privacy</p>
      <DialogTitle>개인정보 안내</DialogTitle>
      <DialogDescription>
        입력한 이름, 나이, 지역, 직업, 자기소개, 사진은 추천과 매칭 상대에게 보여요.
      </DialogDescription>
      <p className="muted">
        지금은 서버 연동 전이라 가입 정보와 좋아요, 대화, 차단, 신고 기록이 모두 이 브라우저에만
        저장돼요. 비밀번호는 해시로만 저장해요. 브라우저 데이터를 지우면 함께 사라져요.
      </p>
    </>
  );

const AppSheets = () => {
  const { sheet, openSheet } = useApp();
  const close = () => openSheet(null);
  return (
    <Dialog open={sheet !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent>
        {sheet?.kind === 'filters' && <FiltersSheet close={close} />}
        {sheet?.kind === 'safety' && <SafetySheet id={sheet.id} close={close} />}
        {sheet?.kind === 'report' && <ReportSheet id={sheet.id} close={close} />}
        {sheet?.kind === 'blocked' && <BlockedSheet />}
        {(sheet?.kind === 'social' || sheet?.kind === 'privacy') && <InfoSheet kind={sheet.kind} />}
      </DialogContent>
    </Dialog>
  );
};
export default AppSheets;
