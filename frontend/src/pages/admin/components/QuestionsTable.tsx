import type { Question } from '../mock';
import { cn } from '@/lib/utils';
import { AdminTable } from './AdminUI';

export default function QuestionsTable({
  questions,
  onToggle,
}: {
  questions: Question[];
  onToggle: (question: Question) => void;
}) {
  return (
    <AdminTable>
      <thead>
        <tr>
          <th>문항 ID</th>
          <th>분류</th>
          <th>문항 / 선택지</th>
          <th>용도</th>
          <th>활성 여부</th>
        </tr>
      </thead>
      <tbody>
        {questions.map((question) => (
          <tr key={question.id}>
            <td>
              <span className="font-mono text-[11px] text-[#a399b5]">{question.id}</span>
            </td>
            <td>
              <span className="rounded-[5px] bg-[#f4f2f8] px-2 py-[3px] text-[10px] text-[#93849f]">
                {question.section}
              </span>
            </td>
            <td className="min-w-[310px] whitespace-normal">
              <strong className="text-xs">{question.text}</strong>
              <small className="max-w-[540px] leading-[1.8]">{question.options.join(' · ')}</small>
            </td>
            <td>{question.purpose}</td>
            <td>
              <button
                className={cn(
                  'inline-flex h-[19px] w-8 items-center rounded-full border-0 p-[3px]',
                  question.active ? 'bg-[#9a7bcf]' : 'bg-[#d9dce4]',
                )}
                role="switch"
                aria-checked={question.active}
                aria-label={`${question.id} 활성 여부`}
                onClick={() => onToggle(question)}
              >
                <span
                  className={cn(
                    'block size-[13px] rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none',
                    question.active && 'translate-x-[13px]',
                  )}
                />
              </button>
              <small>{question.active ? '활성' : '비활성'}</small>
            </td>
          </tr>
        ))}
      </tbody>
    </AdminTable>
  );
}
