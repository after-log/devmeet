import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Info, Plus, RefreshCw, ShieldCheck, Sliders } from 'lucide-react';
import { adminApi, adminDate } from './api';
import { useAdmin } from './hooks/useAdmin';
import { AdminButton, Panel } from './components/AdminUI';
import MatchingPresetDialog from './components/MatchingPresetDialog';
import MatchingWorkspaceDialog from './components/MatchingWorkspaceDialog';
import MatchingPresetPicker from './components/MatchingPresetPicker';
import WeightBar, { matchingWeights as weights } from './components/MatchingPresetSummary';
import type { MatchingPreset, MatchingPresetDraft, MatchingSettings } from './types';

const initialDraft = (): MatchingPresetDraft => ({
  baseId: null,
  name: '',
  description: '',
  valuesWeight: 40,
  meetingWeight: 30,
  contactWeight: 30,
});
const number = new Intl.NumberFormat('ko-KR');
const rate = (count: number, total: number) =>
  total ? `${((count / total) * 100).toFixed(1)}%` : '—';

export default function AdminMatchingPage() {
  const { loading: refreshing } = useAdmin();
  const [data, setData] = useState<MatchingSettings | null>(null);
  const [draft, setDraft] = useState<MatchingPresetDraft>(initialDraft);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  const [pending, setPending] = useState<{
    action: 'apply' | 'delete';
    preset: MatchingPreset;
  } | null>(null);
  const [dialogError, setDialogError] = useState('');
  const dialogTrigger = useRef<HTMLElement | null>(null);
  const libraryTitle = useRef<HTMLHeadingElement>(null);
  const [workspace, setWorkspace] = useState<'edit' | 'select' | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [workspaceError, setWorkspaceError] = useState('');
  const workspaceTrigger = useRef<HTMLElement | null>(null);
  const workspaceTitle = useRef<HTMLHeadingElement>(null);
  const editorFromPicker = useRef(false);
  const inFlight = useRef(false);
  useEffect(() => {
    let active = true;
    if (refreshing) return;
    setLoading(true);
    adminApi
      .matching()
      .then((result) => {
        if (active) {
          setData(result);
          setError('');
        }
      })
      .catch((error: unknown) => {
        if (active)
          setError(error instanceof Error ? error.message : '매칭 설정을 불러오지 못했어요.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshing, reload]);

  const visiblePresets = data?.presets.filter((preset) => !preset.deletedAt) ?? [];
  const activePreset = data?.presets.find((preset) => preset.id === data.activeId);
  const total = draft.valuesWeight + draft.meetingWeight + draft.contactWeight;
  const valid =
    draft.name.trim().length > 0 &&
    total === 100 &&
    weights.every(
      ({ key }) => Number.isInteger(draft[key]) && draft[key] >= 0 && draft[key] <= 100,
    );
  const startDraft = (preset?: MatchingPreset, asVersion = false, trigger?: HTMLElement) => {
    if (trigger && !workspace) workspaceTrigger.current = trigger;
    editorFromPicker.current = workspace === 'select';
    setWorkspaceError('');
    setDraft(
      preset
        ? {
            baseId: asVersion ? preset.id : null,
            name: asVersion ? preset.name : `${preset.name.slice(0, 57)} 복사`,
            description: preset.legacyScoring ? '' : preset.description,
            valuesWeight: preset.legacyScoring ? 40 : preset.valuesWeight,
            meetingWeight: preset.legacyScoring ? 30 : preset.meetingWeight,
            contactWeight: preset.legacyScoring ? 30 : preset.contactWeight,
          }
        : initialDraft(),
    );
    setNotice('');
    setWorkspace('edit');
  };
  const save = async () => {
    if (!valid || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setWorkspaceError('');
    setNotice('');
    try {
      const saved = await adminApi.createMatchingPreset(draft);
      setData((current) => current && { ...current, presets: [saved, ...current.presets] });
      setDraft(initialDraft());
      setSelectedPresetId(saved.id);
      setWorkspace('select');
      setNotice(
        `${saved.name} v${saved.version}을 저장했어요. 적용 버튼을 누르면 새 추천부터 사용합니다.`,
      );
      setReload((value) => value + 1);
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : '프리셋을 저장하지 못했어요.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const openPicker = (trigger: HTMLElement) => {
    workspaceTrigger.current = trigger;
    setSelectedPresetId(data?.activeId ?? '');
    setWorkspaceError('');
    setNotice('');
    setWorkspace('select');
  };
  const restoreWorkspaceFocus = () => {
    const trigger = workspaceTrigger.current;
    if (trigger?.isConnected && !trigger.matches(':disabled')) trigger.focus();
    else libraryTitle.current?.focus();
  };
  const openConfirmation = (
    action: 'apply' | 'delete',
    preset: MatchingPreset,
    trigger: HTMLElement,
  ) => {
    dialogTrigger.current = trigger;
    setDialogError('');
    setPending({ action, preset });
  };
  const confirm = async () => {
    if (!pending || inFlight.current) return;
    const { action, preset } = pending;
    inFlight.current = true;
    setBusy(true);
    setDialogError('');
    setNotice('');
    try {
      if (action === 'delete') {
        await adminApi.deleteMatchingPreset(preset.id);
        setData(
          (current) =>
            current && {
              ...current,
              presets: current.presets.map((item) =>
                item.id === preset.id ? { ...item, deletedAt: new Date().toISOString() } : item,
              ),
            },
        );
        if (draft.baseId === preset.id) setDraft(initialDraft());
        if (selectedPresetId === preset.id) setSelectedPresetId(data?.activeId ?? '');
        setNotice(`${preset.name} v${preset.version}을 삭제했어요. 과거 성과 기록은 유지됩니다.`);
      } else {
        await adminApi.activateMatchingPreset(preset.id);
        setData((current) => current && { ...current, activeId: preset.id });
        setWorkspace(null);
        setNotice(
          `${preset.name} v${preset.version}을 적용했어요. 이미 배정된 오늘의 추천은 유지됩니다.`,
        );
      }
      setPending(null);
      setReload((value) => value + 1);
    } catch (error) {
      setDialogError(
        error instanceof Error
          ? error.message
          : `프리셋을 ${action === 'delete' ? '삭제' : '적용'}하지 못했어요.`,
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">매칭 설정</h1>
          <p className="mt-1! text-sm text-neutral-600">
            추천 우선순위를 프리셋으로 관리하고 연결 성과를 비교하세요.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminButton
            disabled={busy || loading || !data}
            onClick={(event) => openPicker(event.currentTarget)}
          >
            프리셋 선택
          </AdminButton>
          <AdminButton
            disabled={busy || !data}
            onClick={(event) => startDraft(undefined, false, event.currentTarget)}
          >
            <Plus size={16} /> 새 프리셋
          </AdminButton>
        </div>
      </div>
      {activePreset && (
        <section
          aria-labelledby="active-preset-title"
          className="mb-6 overflow-hidden rounded-xl border border-indigo-300 bg-white shadow-[0_3px_12px_#4f46e50a]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-indigo-100 bg-indigo-50 px-5 py-3">
            <h2
              id="active-preset-title"
              className="flex items-center gap-2 text-sm font-semibold text-indigo-950"
            >
              <Sliders size={16} /> 현재 운영 프리셋
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
              <Check size={13} /> 적용 중
            </span>
          </div>
          <div className="grid grid-cols-[1fr_1.2fr] items-center gap-6 p-6 max-[1100px]:grid-cols-1 max-sm:p-5">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2.5">
                <h3 className="text-2xl font-semibold tracking-tight text-neutral-900">
                  {activePreset.name}
                </h3>
                <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs font-medium text-neutral-600">
                  버전 {activePreset.version}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-neutral-600">
                {activePreset.description || '현재 추천 순위를 결정하는 프리셋입니다.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <AdminButton
                  disabled={busy || !data}
                  onClick={(event) => startDraft(activePreset, false, event.currentTarget)}
                >
                  <Copy size={15} /> 이 설정 복제
                </AdminButton>
                <AdminButton
                  disabled={busy || loading}
                  onClick={(event) => openPicker(event.currentTarget)}
                >
                  다른 프리셋 선택
                </AdminButton>
              </div>
            </div>
            <div>
              <div className="grid grid-cols-3 gap-2.5">
                {weights.map(({ key, label, color }) => (
                  <div
                    key={key}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 max-sm:px-2.5"
                  >
                    <p className="mb-2! flex items-center gap-1.5 text-xs text-neutral-600">
                      <span className={`size-2 shrink-0 rounded-sm ${color}`} aria-hidden="true" />
                      {label}
                    </p>
                    <p className="text-2xl font-semibold tracking-tight text-neutral-900 tabular-nums">
                      {activePreset[key]}
                      <span className="ml-1 text-sm font-normal text-neutral-500">
                        {activePreset.legacyScoring ? '점' : '%'}
                      </span>
                    </p>
                    {activePreset.legacyScoring && key === 'valuesWeight' && (
                      <p className="mt-1! text-xs text-neutral-500">일치 문항당</p>
                    )}
                  </div>
                ))}
              </div>
              {!activePreset.legacyScoring && (
                <div
                  className="mt-3 flex h-2 overflow-hidden rounded-full bg-neutral-100"
                  aria-hidden="true"
                >
                  {weights.map(({ key, color }) => (
                    <div key={key} className={color} style={{ width: `${activePreset[key]}%` }} />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-neutral-100 bg-neutral-50 px-5 py-3 text-xs text-neutral-500">
            전체 회원의 새 추천에 사용 중 · 이미 배정된 오늘의 추천은 유지됩니다.
          </div>
        </section>
      )}
      <div className="mb-6 grid grid-cols-2 gap-4 max-[1000px]:grid-cols-1">
        <Panel>
          <div className="p-5">
            <h2 className="mb-2! flex items-center gap-2 text-sm font-semibold">
              <Sliders size={17} /> 매칭 우선순위란?
            </h2>
            <p className="text-sm leading-relaxed text-neutral-600">
              조건에 맞는 후보 중 누구를 먼저 추천할지 정하는 기준입니다. 가중치가 높은 항목이 더 큰
              영향을 주며, 가치관은 전체 활성 매칭 문항 중 일치하는 답변의 비율로 계산합니다. 미응답
              문항은 일치로 계산하지 않습니다.
            </p>
          </div>
        </Panel>
        <Panel>
          <div className="p-5">
            <h2 className="mb-2! flex items-center gap-2 text-sm font-semibold">
              <Copy size={17} /> 프리셋이란?
            </h2>
            <p className="text-sm leading-relaxed text-neutral-600">
              추천 항목과 가중치를 묶어 저장한 설정입니다. 저장과 적용은 별도이며, 수정하면 새
              버전으로 남습니다. 적용 후 새로 생성되는 추천부터 사용하고, 이전 버전을 다시 적용할
              수도 있습니다.
            </p>
          </div>
        </Panel>
      </div>
      <div className="mb-6 flex items-start gap-2 rounded-lg border border-neutral-200 bg-neutral-100 px-4 py-3 text-sm text-neutral-600">
        <ShieldCheck size={18} className="mt-0.5 shrink-0" />
        <p>
          회원의 나이·지역·선호 직군 조건과 사진 승인·차단·이용 제한 기준은 모든 프리셋에 공통
          적용됩니다. 하루 추천·좋아요 한도도 유지됩니다.
        </p>
      </div>
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
          <button
            className="ml-3 underline"
            disabled={busy || loading}
            onClick={() => setReload((v) => v + 1)}
          >
            다시 불러오기
          </button>
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {notice}
        </div>
      )}
      {loading && (
        <p role="status" className="mb-4! flex items-center gap-2 text-sm text-neutral-500">
          <RefreshCw size={15} className="animate-spin motion-reduce:animate-none" /> 매칭 설정을
          불러오는 중…
        </p>
      )}
      {workspace && (
        <MatchingWorkspaceDialog
          title={
            workspace === 'select'
              ? '프리셋 선택'
              : draft.baseId
                ? '새 버전 만들기'
                : '프리셋 만들기'
          }
          description={
            workspace === 'select'
              ? '추천에 적용할 프리셋을 선택하세요. 복제와 버전 관리도 여기서 할 수 있습니다.'
              : '가중치 합계를 100%로 맞춰 저장하세요. 저장 후 적용할 프리셋을 선택할 수 있습니다.'
          }
          busy={busy || !!pending}
          heading={workspaceTitle}
          close={() => {
            if (!inFlight.current && !pending) setWorkspace(null);
          }}
          restoreFocus={restoreWorkspaceFocus}
        >
          {workspace === 'edit' ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
              className="p-5"
            >
              {workspaceError && (
                <p
                  role="alert"
                  className="mb-4! rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                >
                  {workspaceError}
                </p>
              )}
              <fieldset disabled={busy || !data} className="m-0 min-w-0 border-0 p-0">
                <label className="mb-4 block text-sm font-medium">
                  프리셋 이름
                  <input
                    required
                    maxLength={60}
                    disabled={!!draft.baseId}
                    value={draft.name}
                    onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                    placeholder="예: 가치관 중심"
                    className="mt-2 block w-full rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-800 disabled:bg-neutral-100"
                  />
                </label>
                <label className="mb-5 block text-sm font-medium">
                  설명
                  <textarea
                    maxLength={300}
                    rows={2}
                    value={draft.description}
                    onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                    placeholder="어떤 연결을 우선하는 설정인지 적어 주세요."
                    className="mt-2 block w-full resize-y rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-800"
                  />
                </label>
                <div className="mb-5 flex items-center justify-between border-b border-neutral-100 pb-3">
                  <h3 className="text-sm font-semibold">항목별 가중치</h3>
                  <span
                    className={`text-sm font-medium ${total === 100 ? 'text-emerald-700' : 'text-red-700'}`}
                    aria-live="polite"
                  >
                    합계 {total}% / 100%
                  </span>
                </div>
                {weights.map(({ key, label, detail }) => (
                  <div className="mb-5" key={key}>
                    <div className="flex items-center justify-between gap-3">
                      <label htmlFor={`matching-${key}`} className="text-sm font-medium">
                        {label}
                      </label>
                      <div className="flex items-center gap-1 text-sm">
                        <input
                          id={`matching-${key}`}
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          required
                          value={draft[key]}
                          onChange={(event) =>
                            setDraft({ ...draft, [key]: Number(event.target.value) })
                          }
                          className="w-20 rounded-md border border-neutral-200 bg-white p-2 text-right text-sm text-neutral-800"
                        />
                        <span>%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      aria-label={`${label} 가중치`}
                      min={0}
                      max={100}
                      step={1}
                      value={draft[key]}
                      onChange={(event) =>
                        setDraft({ ...draft, [key]: Number(event.target.value) })
                      }
                      className="mt-3 h-2 min-h-0 w-full cursor-pointer border-0 bg-transparent p-0 accent-indigo-600"
                    />
                    <p className="mt-2! text-xs text-neutral-500">{detail}</p>
                  </div>
                ))}
                {total !== 100 && (
                  <p className="mb-3! text-sm text-red-700">가중치 합계를 100%로 맞춰 주세요.</p>
                )}
                <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
                  <AdminButton
                    disabled={busy}
                    onClick={() => setWorkspace(editorFromPicker.current ? 'select' : null)}
                  >
                    {editorFromPicker.current ? '선택 화면으로' : '취소'}
                  </AdminButton>
                  <AdminButton type="submit" variant="primary" disabled={busy || !valid || !data}>
                    {busy ? '처리 중…' : draft.baseId ? '새 버전 저장' : '프리셋 저장'}
                  </AdminButton>
                </div>
              </fieldset>
            </form>
          ) : (
            <MatchingPresetPicker
              presets={visiblePresets}
              activeId={data?.activeId ?? ''}
              selectedId={selectedPresetId}
              busy={busy || !!pending}
              loading={loading}
              notice={notice}
              error={error}
              retry={() => setReload((value) => value + 1)}
              select={setSelectedPresetId}
              create={() => startDraft()}
              edit={(preset, asVersion) => startDraft(preset, asVersion)}
              remove={(preset, trigger) => openConfirmation('delete', preset, trigger)}
              apply={(preset, trigger) => openConfirmation('apply', preset, trigger)}
              close={() => {
                if (!inFlight.current) setWorkspace(null);
              }}
            />
          )}
        </MatchingWorkspaceDialog>
      )}
      {pending && (
        <MatchingPresetDialog
          action={pending.action}
          preset={pending.preset}
          busy={busy}
          error={dialogError}
          close={() => {
            if (!inFlight.current) setPending(null);
          }}
          confirm={() => void confirm()}
          restoreFocus={() => {
            const trigger = dialogTrigger.current;
            if (trigger?.isConnected && !trigger.matches(':disabled')) trigger.focus();
            else if (workspaceTitle.current?.isConnected) workspaceTitle.current.focus();
            else restoreWorkspaceFocus();
          }}
        />
      )}
      <section aria-labelledby="preset-library-title" className="mb-8">
        <h2
          ref={libraryTitle}
          tabIndex={-1}
          id="preset-library-title"
          className="mb-4! text-base font-semibold"
        >
          프리셋 보관함{' '}
          <span className="ml-1 text-sm font-normal text-neutral-500">{visiblePresets.length}</span>
        </h2>
        <div className="grid grid-cols-2 gap-4 max-[1000px]:grid-cols-1">
          {visiblePresets.map((preset) => (
            <Panel
              key={preset.id}
              className={
                preset.id === data?.activeId
                  ? 'border-indigo-300 bg-indigo-50/20 ring-1 ring-indigo-100'
                  : undefined
              }
            >
              <div className="p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{preset.name}</h3>
                  <span className="text-xs text-neutral-500">v{preset.version}</span>
                  {preset.id === data?.activeId && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white">
                      <Check size={12} /> 적용 중
                    </span>
                  )}
                </div>
                <p className="mb-4! text-sm text-neutral-600">
                  {preset.description || '등록된 설명이 없습니다.'}
                </p>
                <WeightBar preset={preset} />
                <p className="mt-4! border-t border-neutral-100 pt-3 text-xs text-neutral-500">
                  {adminDate(preset.createdAt)} 저장
                </p>
              </div>
            </Panel>
          ))}
        </div>
      </section>
      <section aria-labelledby="preset-performance-title">
        <div className="mb-4">
          <h2 id="preset-performance-title" className="text-base font-semibold">
            프리셋별 연결 성과
          </h2>
          <p className="mt-1! text-sm text-neutral-600">
            최근 30일에 배정한 추천 중 7일의 관찰 기간이 끝난 추천을 비교합니다.
          </p>
        </div>
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-600">
                <tr>
                  {['프리셋', '회원 수', '추천 건수', '좋아요 전환', '매칭 전환'].map((label) => (
                    <th key={label} className="px-5 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.presets.map((preset) => {
                  const stats = data.performance.find((row) => row.presetId === preset.id);
                  const count = stats?.recommendations ?? 0;
                  return (
                    <tr key={preset.id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-5 py-4 font-medium">
                        {preset.name}{' '}
                        <span className="text-xs font-normal text-neutral-500">
                          v{preset.version}
                        </span>
                        {preset.deletedAt && (
                          <span className="ml-2 rounded bg-neutral-100 px-2 py-1 text-xs font-normal text-neutral-500">
                            삭제됨
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 tabular-nums">
                        {number.format(stats?.members ?? 0)}명
                      </td>
                      <td className="px-5 py-4 tabular-nums">{number.format(count)}건</td>
                      <td className="px-5 py-4 tabular-nums">
                        {rate(stats?.likes ?? 0, count)}
                        <span className="mt-1 block text-xs text-neutral-500">
                          {number.format(stats?.likes ?? 0)}건
                        </span>
                      </td>
                      <td className="px-5 py-4 tabular-nums">
                        {rate(stats?.matches ?? 0, count)}
                        <span className="mt-1 block text-xs text-neutral-500">
                          {count ? `${number.format(stats?.matches ?? 0)}건` : '관찰 데이터 대기'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-neutral-500">
          <Info size={15} className="mt-0.5 shrink-0" />
          <p>
            전환율은 실제 조회가 아닌 추천 배정 건수를 기준으로, 배정 후 7일 이내 보낸 좋아요와 상호
            매칭을 집계합니다. 같은 상대를 다른 날 추천한 경우 별도 배정 건으로 계산합니다. 설정
            도입 전 추천은 제외합니다. 무작위 A/B 실험 결과가 아니므로 회원 구성과 적용 시기에 따라
            차이가 날 수 있습니다.
          </p>
        </div>
      </section>
    </>
  );
}
