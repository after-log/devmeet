import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Question } from '../mock';
import { cn } from '@/lib/utils';
import AdminDataTable from './AdminDataTable';

export default function QuestionsTable({
  questions,
  onToggle,
  search,
  status,
  category,
}: {
  questions: Question[];
  onToggle: (question: Question) => void;
  search: string;
  status: string;
  category: string;
}) {
  const columns = useMemo<ColumnDef<Question>[]>(
    () => [
      {
        accessorKey: 'id',
        header: '문항 ID',
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-[#a3a3a3]">{row.original.id}</span>
        ),
      },
      {
        accessorKey: 'section',
        header: '분류',
        enableGlobalFilter: false,
        filterFn: 'equalsString',
        cell: ({ row }) => (
          <span className="rounded-[5px] bg-[#f5f5f5] px-2 py-[3px] text-[10px] text-[#737373]">
            {row.original.section}
          </span>
        ),
      },
      {
        accessorKey: 'text',
        header: '문항 / 선택지',
        cell: ({ row: { original: question } }) => (
          <div className="min-w-[264px] whitespace-normal">
            <strong className="text-xs">{question.text}</strong>
            <small className="max-w-[540px] leading-[1.8]">{question.options.join(' · ')}</small>
          </div>
        ),
      },
      { accessorKey: 'purpose', header: '용도', enableGlobalFilter: false },
      {
        id: 'status',
        accessorFn: (question) => (question.active ? 'ACTIVE' : 'INACTIVE'),
        header: '활성 여부',
        enableGlobalFilter: false,
        filterFn: 'equalsString',
        cell: ({ row: { original: question } }) => (
          <>
            <button
              className={cn(
                'inline-flex h-[19px] w-8 items-center rounded-full border-0 p-[3px]',
                question.active ? 'bg-[#404040]' : 'bg-[#d4d4d4]',
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
          </>
        ),
      },
    ],
    [onToggle],
  );
  const columnFilters = useMemo(
    () => [
      ...(status === 'ALL' ? [] : [{ id: 'status', value: status }]),
      ...(category === 'ALL' ? [] : [{ id: 'section', value: category }]),
    ],
    [status, category],
  );
  return (
    <AdminDataTable
      data={questions}
      columns={columns}
      search={search}
      columnFilters={columnFilters}
      caption="가치관 문항 목록"
    />
  );
}
