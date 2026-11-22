import { Controller } from 'react-hook-form';
import { useSchemaForm } from '@/hooks/useSchemaForm';
import { preferencesSchema } from '@/validation/profile';
import { reportSchema } from '@/validation/community';
import { FormErrors } from '@/components/ui/form-errors';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useApp } from '../stores/app';
import { useProfileMutations } from '@/hooks/queries/useProfileMutations';
import { useSafetyMutations, useBlockedPeople } from '@/hooks/queries/useSafety';
import { REPORT_REASONS } from '@/data/options';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import SocialButtons from '@/components/SocialButtons';

const FiltersSheet = ({ close }: { close: () => void }) => {
  const { user, demo, draft, setDraft } = useApp();
  const profileMutations = useProfileMutations();
  const p = user?.profile ?? draft;
  const form = useSchemaForm(preferencesSchema, {
    defaultValues: { region: p.region ?? '', minAge: p.minAge ?? 19, maxAge: p.maxAge ?? 60 },
  });
  const save = async (patch: { region: string; minAge: number; maxAge: number }) => {
    try {
      if (demo || !user?.profile) setDraft(patch);
      else {
        await profileMutations.saveProfile({ ...user.profile, ...patch });
      }
      close();
      toast('추천 조건을 저장했어요.');
    } catch (err) {
      toast((err as Error).message);
    }
  };
  return (
    <form noValidate onSubmit={form.handleSubmit(save)}>
      <p className="eyebrow">// preferences</p>
      <DialogTitle>추천 조건</DialogTitle>
      <label className="formlabel" htmlFor="filter-region">
        지역
      </label>
      <Controller
        name="region"
        control={form.control}
        render={({ field }) => (
          <Select
            id="filter-region"
            value={field.value || 'all'}
            onValueChange={(value) => field.onChange(value === 'all' ? '' : value)}
            options={[
              { value: 'all', label: '서울·경기 전체' },
              { value: '서울', label: '서울시' },
              { value: '경기', label: '경기도' },
            ]}
          />
        )}
      />

      <div className="grid grid-cols-2 gap-2">
        <label className="formlabel">
          최소 나이
          <input
            className="mt-2"
            type="number"
            min={19}
            max={80}
            {...form.register('minAge', { valueAsNumber: true })}
          />
        </label>
        <label className="formlabel">
          최대 나이
          <input
            className="mt-2"
            type="number"
            min={19}
            max={80}
            {...form.register('maxAge', { valueAsNumber: true })}
          />
        </label>
      </div>
      <DialogDescription className="secure mt-[22px]">
        변경한 조건은 다음 날 새 추천에 적용돼요.
        <br />
        오늘 이미 배정된 인연은 유지돼요.
      </DialogDescription>
      <FormErrors errors={form.formState.errors} />
      <button type="submit" className="btn full" disabled={form.formState.isSubmitting}>
        조건 저장
      </button>
    </form>
  );
};

const SafetySheet = ({ id, close }: { id: string; close: () => void }) => {
  const safety = useSafetyMutations();
  const navigate = useNavigate();
  const { demo, demoBlock, openSheet } = useApp();
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
          try {
            if (demo) demoBlock(id);
            else {
              await safety.block(id);
            }
            close();
            navigate('/chat');
            toast('차단했어요. 추천과 대화 목록에서 서로 보이지 않아요.');
          } catch (err) {
            toast((err as Error).message);
          }
        }}
      >
        차단하기
      </button>
      <p className="footnote">차단하면 추천과 대화 목록에서 서로 보이지 않아요.</p>
    </>
  );
};

const ReportSheet = ({ id, close }: { id: string; close: () => void }) => {
  const safety = useSafetyMutations();
  const demo = useApp((s) => s.demo);
  const form = useSchemaForm(reportSchema.omit({ id: true }), {
    defaultValues: { reason: REPORT_REASONS[0] },
  });
  return (
    <>
      <p className="eyebrow">// report</p>
      <DialogTitle>신고 접수</DialogTitle>
      <label className="formlabel" htmlFor="report-reason">
        어떤 문제가 있었나요?
      </label>
      <Controller
        name="reason"
        control={form.control}
        render={({ field }) => (
          <Select
            id="report-reason"
            value={field.value}
            onValueChange={field.onChange}
            options={REPORT_REASONS}
          />
        )}
      />
      <FormErrors errors={form.formState.errors} />
      <button
        className="btn full"
        disabled={form.formState.isSubmitting}
        onClick={form.handleSubmit(async ({ reason }) => {
          if (demo) {
            close();
            return toast('둘러보기에서는 실제 신고가 접수되지 않아요.');
          }
          try {
            const r = await safety.report(id, reason);
            close();
            toast(`신고를 기록했어요 · ${r.id.slice(0, 8)}`);
          } catch (err) {
            toast((err as Error).message);
          }
        })}
      >
        신고 기록하기
      </button>
      <p className="footnote">
        신고는 운영자가 검토하며, 신고자의 정보는 상대에게 공개되지 않아요.
      </p>
    </>
  );
};

const BlockedSheet = () => {
  const demo = useApp((s) => s.demo);
  const safety = useSafetyMutations();
  const blocked = useBlockedPeople();
  const people = demo ? [] : (blocked.data?.people ?? (blocked.isPending ? null : []));
  return (
    <>
      <p className="eyebrow">// blocked</p>
      <DialogTitle>차단한 프로필</DialogTitle>
      {blocked.error && (
        <p role="alert" className="text-sub">
          {blocked.error.message}
        </p>
      )}
      {people === null ? (
        <p className="muted">불러오는 중…</p>
      ) : people.length ? (
        people.map((p) => (
          <div className="settings-row items-center" key={p.id}>
            {p.name}, {p.age}
            <button
              className="tag"
              onClick={async () => {
                try {
                  await safety.block(p.id, true);

                  toast('차단을 해제했어요.');
                } catch (err) {
                  toast((err as Error).message);
                }
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

const InfoSheet = ({ kind }: { kind: 'social' | 'privacy' }) => {
  const { user, demo } = useApp();
  return kind === 'social' ? (
    <>
      <p className="eyebrow">// developer.verification</p>
      <DialogTitle>개발자 인증</DialogTitle>
      <DialogDescription>
        GitHub 인증으로 본인 소유의 계정인지 확인해요. 개발 경력이나 재직 여부를 증명하지는 않아요.
      </DialogDescription>
      {demo ? (
        <p className="muted">
          GitHub 인증은 둘러보기를 종료하고 카카오로 로그인한 뒤 이용해 주세요.
        </p>
      ) : user?.verification?.github ? (
        <p className="text-sm text-point" role="status">
          GitHub 인증 완료
        </p>
      ) : user ? (
        <SocialButtons link />
      ) : (
        <p className="muted">카카오로 로그인한 뒤 GitHub 인증을 진행해 주세요.</p>
      )}
    </>
  ) : (
    <>
      <p className="eyebrow">// privacy</p>
      <DialogTitle>개인정보 안내</DialogTitle>
      <DialogDescription>
        입력한 이름, 나이, 지역, 직업, 자기소개, 사진은 추천과 매칭 상대에게 보여요.
      </DialogDescription>
      <p className="muted">
        가입 정보, 좋아요, 대화, 차단, 신고 기록은 서버에 저장돼요. 비밀번호는 해시로 저장하며
        비공개 가치관 답변과 신고자 정보는 다른 회원에게 공개하지 않아요.
      </p>
    </>
  );
};

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
