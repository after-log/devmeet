import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { categories } from '../mock';
import { useAdminMock } from '../hooks/useAdminMock';
import { AdminButton, Field, Modal, ModalActions } from '../components/AdminUI';

export default function QuestionCreateDialog() {
  const { closeDialog, addQuestion } = useAdminMock();
  const [draft, setDraft] = useState({
    text: '',
    section: categories[0].label,
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
          <label className="block text-[11px] font-medium text-[#6f677b]">
            분류
            <select
              className="mt-[7px] block min-h-[42px] w-full rounded-lg border border-[#dfe3eb] bg-white px-3 py-2.5 text-xs font-normal text-[#293040]"
              value={draft.section}
              onChange={(e) => setDraft({ ...draft, section: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] font-medium text-[#6f677b]">
            용도
            <select
              className="mt-[7px] block min-h-[42px] w-full rounded-lg border border-[#dfe3eb] bg-white px-3 py-2.5 text-xs font-normal text-[#293040]"
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
            className="mt-[7px] block min-h-[42px] w-full rounded-lg border border-[#dfe3eb] bg-white px-3 py-2.5 text-xs font-normal text-[#293040] placeholder:text-[#9a9faf]"
            required
            maxLength={200}
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            placeholder="예: 함께 보내는 주말은 어떤 모습인가요?"
          />
        </Field>
        <div className="mt-[22px]">
          <strong className="text-[11px] font-medium text-[#6f677b]">
            선택지{' '}
            <span className="ml-1.5 text-[10px] font-normal text-[#aaa3b5]">
              서로 다른 선택지 4개를 입력해 주세요.
            </span>
          </strong>
          {draft.options.map((option, i) => (
            <label key={i} className="mt-2.5 flex items-center gap-2.5">
              <span className="rounded-[5px] bg-[#f3eff9] p-1.5 font-mono text-[10px] text-[#9a86b6]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <input
                className="min-h-[42px] w-full rounded-lg border border-[#dfe3eb] bg-white px-3 py-2.5 text-xs text-[#293040] placeholder:text-[#9a9faf]"
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
        <p className="mt-2.5! text-[10px] text-[#aaa3b4]">추가된 문항은 활성 상태로 시작합니다.</p>
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
