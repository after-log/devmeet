import { useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Eye, LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';
import { useValueCatalog, type ValueSection } from '@/hooks/useValueCatalog';
import { useApp } from '@/stores/app';
import { api } from '@/lib/api';
import type { ValueAnswer, ValueAnswers } from '@/types';
import { normalizeValueAnswers, publicValueAnswers, PUBLIC_VALUE_LIMIT } from '@/lib/value-answers';

const ValuesPage = () => {
  const demo = useApp((state) => state.demo);
  const catalog = useValueCatalog(demo);
  const total = catalog.sections.reduce((sum, section) => sum + section.questions.length, 0);
  if (catalog.error && !total)
    return (
      <div role="alert">
        <p>{catalog.error}</p>
        <button className="btn" onClick={() => void catalog.refresh()}>
          다시 불러오기
        </button>
      </div>
    );
  if (catalog.loading && !total) return <p role="status">가치관 문항을 불러오는 중…</p>;
  if (!total)
    return (
      <>
        <p>현재 활성화된 가치관 문항이 없어요.</p>
        <Link className="back" to="/me">
          내 프로필로 돌아가기
        </Link>
      </>
    );
  return (
    <>
      {catalog.error && (
        <div role="alert" className="mb-4 rounded-lg border border-orange p-3 text-xs text-orange">
          {catalog.error}
          <button className="ml-2 underline" onClick={() => void catalog.refresh()}>
            다시 불러오기
          </button>
        </div>
      )}
      <ValuesEditor sections={catalog.sections} />
    </>
  );
};

const ValuesEditor = ({ sections }: { sections: ValueSection[] }) => {
  const questions = sections.flatMap((section) => section.questions);
  const total = questions.length;
  const { user, demo, demoValueAnswers, setDemoValueAnswers, setUser } = useApp();
  const initial = demo ? demoValueAnswers : (user?.profile?.valueAnswers ?? {});
  const [answers, setAnswers] = useState<ValueAnswers>(() =>
    normalizeValueAnswers(initial, questions),
  );
  const [saved, setSaved] = useState(() => normalizeValueAnswers(initial, questions));
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const panel = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const section = sections[Math.min(active, sections.length - 1)];
  const answered = questions.filter((q) => answers[q.id]?.choice != null).length;
  const publicCount = publicValueAnswers(answers, questions).length;
  const sectionCount = section.questions.filter((q) => answers[q.id]?.choice != null).length;
  const dirty = JSON.stringify(answers) !== JSON.stringify(saved);

  const update = (id: string, patch: Partial<ValueAnswer>) => {
    setAnswers((current) => ({
      ...current,
      [id]: { ...(current[id] ?? { choice: null, private: true }), ...patch },
    }));
    setError('');
  };
  const togglePublic = (id: string) => {
    const answer = answers[id];
    if (!answer?.choice) return;
    if (answer.private && publicCount >= PUBLIC_VALUE_LIMIT) {
      toast('프로필에는 최대 10개까지 공개할 수 있어요. 다른 답변의 공개를 먼저 해제해 주세요.');
      return;
    }
    update(id, { private: !answer.private });
  };
  const changeSection = (index: number, focus = false) => {
    setActive(index);
    if (focus) tabs.current[index]?.focus();
    tabs.current[index]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    panel.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };
  const tabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % sections.length;
    else if (event.key === 'ArrowLeft') next = (index + sections.length - 1) % sections.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = sections.length - 1;
    else return;
    event.preventDefault();
    changeSection(next, true);
  };
  const save = async () => {
    setSaving(true);
    setError('');
    try {
      let savedAnswers = answers;
      if (demo) setDemoValueAnswers(answers);
      else {
        const { profile } = await api.saveValues(answers);
        savedAnswers = normalizeValueAnswers(profile.valueAnswers ?? {}, questions);
        const currentUser = useApp.getState().user;
        if (currentUser) setUser({ ...currentUser, profile });
      }
      setAnswers(savedAnswers);
      setSaved(savedAnswers);
      toast(demo ? '체험용 답변을 저장했어요.' : '가치관을 저장했어요.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="values-page">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow mb-2!">// my.values</p>
          <h2>나를 알아가는 질문</h2>
        </div>
        <span className="values-total">
          {answered}
          <span className="text-fg-4"> / {total}</span>
        </span>
      </div>
      <p className="mt-3 mb-5 text-xs leading-6 text-fg-3">
        정답은 없어요. 지금의 나와 가장 가까운 답을 골라주세요.
        <br />
        답변은 기본 비공개예요. 프로필에는 최대 10개까지 골라 공개할 수 있어요.
      </p>
      <div className="mb-5 flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-3 text-xs">
        <span className="inline-flex items-center gap-2 text-fg-2">
          <Eye size={14} />
          프로필에 공개할 답변
        </span>
        <span className="font-mono text-point" aria-live="polite">
          {publicCount} / {PUBLIC_VALUE_LIMIT}
        </span>
      </div>
      <div
        className="mb-6 h-1 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-label="가치관 답변 진행률"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answered}
      >
        <div
          className="h-full rounded-full bg-point transition-all"
          style={{ width: `${(answered / Math.max(total, 1)) * 100}%` }}
        />
      </div>

      <div className="values-tabs" role="tablist" aria-label="가치관 섹션">
        {sections.map((item, index) => (
          <button
            key={item.id}
            ref={(el) => {
              tabs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-controls={`panel-${item.id}`}
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            className={`values-tab ${active === index ? 'is-active' : ''}`}
            onClick={() => changeSection(index)}
            onKeyDown={(event) => tabKey(event, index)}
          >
            {item.label}
            <span>
              {item.questions.filter((q) => answers[q.id]?.choice != null).length}/
              {item.questions.length}
            </span>
          </button>
        ))}
      </div>

      <div
        ref={panel}
        role="tabpanel"
        id={`panel-${section.id}`}
        aria-labelledby={`tab-${section.id}`}
        tabIndex={0}
        className="values-panel"
      >
        <div className="values-section-heading">
          <span className="text-[28px] text-sub" aria-hidden="true">
            {section.icon}
          </span>
          <p className="my-1 font-mono text-xs tracking-[0.2em]">{section.english}</p>
          <p className="mt-2 mb-3 text-xs text-fg-3">{section.description}</p>
          <span className="font-mono text-[10px] text-fg-4">
            {sectionCount} / {section.questions.length} 답변
          </span>
        </div>
        <div className="space-y-9 py-7">
          {section.questions.map((question, index) => {
            const answer = answers[question.id];
            const skipped = answer?.choice === null;
            return (
              <fieldset key={question.id} className="min-w-0 border-0 p-0" disabled={saving}>
                <legend className="mb-3 w-full text-[13px] leading-6 text-fg">
                  <span className="mr-2 font-mono text-[11px] text-fg-4">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {question.text}
                </legend>
                <div className="space-y-2">
                  {question.options.map((option) => {
                    const selected = answer?.choice === option;
                    return (
                      <label
                        key={option}
                        className={`values-option ${selected ? 'is-selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          className="peer sr-only"
                          checked={selected}
                          onChange={() => update(question.id, { choice: option })}
                        />
                        <span className="flex-1">{option}</span>
                        <span className="values-radio" aria-hidden="true">
                          {selected && <Check size={12} strokeWidth={3} />}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    aria-pressed={skipped}
                    className={`text-[11px] underline-offset-4 hover:underline ${skipped ? 'text-point' : 'text-fg-4'}`}
                    onClick={() => {
                      if (skipped)
                        setAnswers((current) => {
                          const next = { ...current };
                          delete next[question.id];
                          return next;
                        });
                      else update(question.id, { choice: null, private: true });
                    }}
                  >
                    {skipped ? '건너뜀 · 취소' : '건너뛰기'}
                  </button>
                  <button
                    type="button"
                    aria-pressed={answer?.choice != null && answer.private === false}
                    aria-label={`${question.text} 프로필에 공개`}
                    disabled={answer?.choice == null}
                    className={`inline-flex items-center gap-1 text-[11px] disabled:opacity-40 ${answer?.choice != null && !answer.private ? 'text-point' : 'text-fg-4'}`}
                    onClick={() => togglePublic(question.id)}
                  >
                    {answer?.choice != null && !answer.private ? (
                      <Eye size={12} />
                    ) : (
                      <LockKeyhole size={12} />
                    )}
                    {answer?.choice != null && !answer.private ? '프로필 공개 중' : '프로필에 공개'}
                  </button>
                </div>
              </fieldset>
            );
          })}
        </div>
        {active < sections.length - 1 && (
          <button className="values-next" onClick={() => changeSection(active + 1, true)}>
            다음 섹션 · {sections[active + 1].label}
            <ArrowRight className="ico" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="values-save">
        {error && (
          <p role="alert" className="mb-2 text-xs text-orange">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <p className="m-0 text-[11px] leading-5 text-fg-3" aria-live="polite">
            <span className="block text-point">
              프로필 공개 {publicCount} / {PUBLIC_VALUE_LIMIT}
            </span>
            {demo
              ? '둘러보기 중인 체험용 답변이에요.'
              : dirty
                ? '변경한 답변을 저장해 주세요.'
                : '저장한 답변은 언제든 바꿀 수 있어요.'}
          </p>
          <button type="button" className="btn shrink-0" disabled={saving || !dirty} onClick={save}>
            {saving ? '저장 중…' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ValuesPage;
