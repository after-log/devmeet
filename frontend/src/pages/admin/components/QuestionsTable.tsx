import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Question } from '../types';
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
          <span className="font-mono text-[13px] text-neutral-600">{row.original.id}</span>
        ),
      },
      {
        accessorKey: 'section',
        header: '분류',
        enableGlobalFilter: false,
        filterFn: 'equalsString',
        cell: ({ row }) => (
          <span className="rounded-md bg-[#f5f5f5] px-2 py-0.75 text-[12px] text-neutral-600">
            {row.original.section}
          </span>
        ),
      },
      {
        accessorKey: 'text',
        header: '문항 / 선택지',
        cell: ({ row: { original: question } }) => (
          <div className="min-w-66 whitespace-normal">
            <strong className="text-sm">{question.text}</strong>
            <small className="max-w-135 leading-[1.8]">{question.options.join(' · ')}</small>
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
                'inline-flex h-6 w-10 items-center rounded-full border-0 p-0.75',
                question.active ? 'bg-emerald-600' : 'bg-neutral-300',
              )}
              role="switch"
              aria-checked={question.active}
              aria-label={`${question.id} 활성 여부`}
              onClick={() => onToggle(question)}
            >
              <span
                className={cn(
                  'block size-4.5 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none',
                  question.active && 'translate-x-4',
                )}
              />
            </button>
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
