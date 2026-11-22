import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { adminDate } from '../api';
import { canReviewCompanyEmail } from '../companyEmail';
import type { CompanyEmailRequest } from '../types';
import { AdminButton } from './AdminUI';
import AdminDataTable from './AdminDataTable';
import CompanyEmailStatus from './CompanyEmailStatus';

export default function CompanyEmailRequestsTable({
  requests,
  onDetail,
  search,
  status,
  disabled,
}: {
  requests: CompanyEmailRequest[];
  onDetail: (request: CompanyEmailRequest, trigger: HTMLElement) => void;
  search: string;
  status: string;
  disabled: boolean;
}) {
  const columns = useMemo<ColumnDef<CompanyEmailRequest>[]>(
    () => [
      {
        id: 'identity',
        accessorFn: (item) => `${item.memberName} ${item.company} ${item.email} ${item.domain}`,
        header: '회원 / 회사',
        cell: ({ row: { original: item } }) => (
          <>
            <strong>{item.memberName}</strong>
            <small>{item.company}</small>
          </>
        ),
      },
      {
        accessorKey: 'email',
        header: '인증 이메일',
        enableGlobalFilter: false,
        cell: ({ row: { original: item } }) => (
          <>
            {item.email}
            <small>{item.sharedDomain ? '공용 메일 · 회원별 검토' : item.domain}</small>
          </>
        ),
      },
      {
        accessorKey: 'status',
        header: '상태',
        enableGlobalFilter: false,
        filterFn: 'equalsString',
        cell: ({ row: { original: item } }) => (
          <>
            <CompanyEmailStatus status={item.status} />
            {!item.current && <small>이전 요청</small>}
          </>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: '요청일',
        enableGlobalFilter: false,
        cell: ({ row }) => adminDate(row.original.createdAt, true),
      },
      {
        id: 'actions',
        header: '검토',
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <AdminButton
            disabled={disabled}
            className="min-h-0 rounded-[5px] px-2.25 py-1.25 text-[12px]"
            onClick={(event) => onDetail(row.original, event.currentTarget)}
          >
            {canReviewCompanyEmail(row.original) ? '검토하기' : '상세 보기'}
          </AdminButton>
        ),
      },
    ],
    [onDetail, disabled],
  );
  const columnFilters = useMemo(
    () => (status === 'ALL' ? [] : [{ id: 'status', value: status }]),
    [status],
  );
  return (
    <>
      <AdminDataTable
        data={requests}
        columns={columns}
        search={search}
        columnFilters={columnFilters}
        caption="기업 이메일 인증 요청"
      />
      <p className="border-t border-neutral-100 p-4 text-xs text-neutral-500">
        검토 대기 요청을 우선하여 최대 500건을 표시합니다. 회사 규모와 관계없이 제출 자료와 도메인의
        실제 소속을 확인해 주세요.
      </p>
    </>
  );
}
