import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Report } from '../mock';
import { AdminButton, Badge } from './AdminUI';
import AdminDataTable from './AdminDataTable';

export default function ReportsTable({
  reports,
  onDetail,
  search,
  status,
}: {
  reports: Report[];
  onDetail: (report: Report) => void;
  search: string;
  status: string;
}) {
  const columns = useMemo<ColumnDef<Report>[]>(
    () => [
      {
        accessorKey: 'id',
        header: '신고 번호 / 접수일',
        cell: ({ row: { original: report } }) => (
          <>
            <strong>{report.id}</strong>
            <small>{report.date}</small>
          </>
        ),
      },
      { accessorKey: 'sender', header: '신고자' },
      { accessorKey: 'target', header: '대상 회원' },
      { accessorKey: 'reason', header: '신고 사유' },
      {
        accessorKey: 'status',
        header: '처리 상태',
        enableGlobalFilter: false,
        filterFn: 'equalsString',
        cell: ({ row }) => <Badge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: '관리',
        cell: ({ row }) => (
          <AdminButton
            className="min-h-0 rounded-[5px] border-[#e5e5e5] px-[9px] py-[5px] text-[12px] text-neutral-600"
            onClick={() => onDetail(row.original)}
          >
            신고 확인
          </AdminButton>
        ),
      },
    ],
    [onDetail],
  );
  const columnFilters = useMemo(
    () => (status === 'ALL' ? [] : [{ id: 'status', value: status }]),
    [status],
  );
  return (
    <AdminDataTable
      data={reports}
      columns={columns}
      search={search}
      columnFilters={columnFilters}
      caption="회원 신고 목록"
    />
  );
}
