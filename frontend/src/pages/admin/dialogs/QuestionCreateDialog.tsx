import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { AdminButton, Field, Modal, ModalActions } from '../components/AdminUI';

export default function QuestionCreateDialog() {
  const { closeDialog, addQuestion, categories } = useAdmin();
  const [draft, setDraft] = useState({
    text: '',
    section: categories[0]?.label ?? '',
    purpose: '매칭',
    options: ['', '', '', ''],
  });
  const valid =
    draft.text.trim() &&
    draft.options.every((v) => v.trim()) &&
    new Set(draft.options.map((v) => v.trim())).size === 4;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (valid) addQuestion(draft);
  };
  return (
    <Modal
      title="가치관 문항 추가"
      description="새로운 질문으로 서로를 더 알아갈 수 있도록 해 주세요."
      close={closeDialog}
    >
      <form onSubmit={submit}>
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-[13px] font-medium text-neutral-600">
            분류
            <select
              className="mt-[7px] block min-h-[42px] w-full rounded-lg border border-[#e5e5e5] bg-white px-3 py-2.5 text-sm font-normal text-[#262626]"
              value={draft.section}
              onChange={(e) => setDraft({ ...draft, section: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-[13px] font-medium text-neutral-600">
            용도
            <select
              className="mt-[7px] block min-h-[42px] w-full rounded-lg border border-[#e5e5e5] bg-white px-3 py-2.5 text-sm font-normal text-[#262626]"
              value={draft.purpose}
              onChange={(e) => setDraft({ ...draft, purpose: e.target.value })}
            >
              <option>매칭</option>
              <option>프로필</option>
            </select>
          </label>
        </div>
        <Field label="문항 내용">
          <input
            className="mt-[7px] block min-h-[42px] w-full rounded-lg border border-[#e5e5e5] bg-white px-3 py-2.5 text-sm font-normal text-[#262626] placeholder:text-neutral-600"
            required
            maxLength={200}
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            placeholder="예: 함께 보내는 주말은 어떤 모습인가요?"
          />
        </Field>
        <div className="mt-[22px]">
          <strong className="text-[13px] font-medium text-neutral-600">
            선택지{' '}
            <span className="ml-1.5 text-[12px] font-normal text-neutral-600">
              서로 다른 선택지 4개를 입력해 주세요.
            </span>
          </strong>
          {draft.options.map((option, i) => (
            <label key={i} className="mt-2.5 flex items-center gap-2.5">
              <span className="rounded-[5px] bg-[#f5f5f5] p-1.5 font-mono text-[12px] text-neutral-600">
                {String(i + 1).padStart(2, '0')}
              </span>
              <input
                className="min-h-[42px] w-full rounded-lg border border-[#e5e5e5] bg-white px-3 py-2.5 text-sm text-[#262626] placeholder:text-neutral-600"
                aria-label={`선택지 ${i + 1}`}
                required
                maxLength={100}
                placeholder={`선택지 ${i + 1}`}
                value={option}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    options: draft.options.map((v, n) => (i === n ? e.target.value : v)),
                  })
                }
              />
            </label>
          ))}
        </div>
        <p className="mt-2.5! text-[12px] text-neutral-600">
          추가된 문항은 활성 상태로 시작합니다.
        </p>
        <ModalActions>
          <AdminButton onClick={closeDialog}>취소</AdminButton>
          <AdminButton type="submit" variant="primary" disabled={!valid}>
            <Plus size={16} /> 문항 추가
          </AdminButton>
        </ModalActions>
      </form>
    </Modal>
  );
}
