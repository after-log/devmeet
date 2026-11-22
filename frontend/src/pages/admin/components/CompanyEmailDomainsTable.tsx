import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { adminDate } from '../api';
import type { CompanyEmailDomain } from '../types';
import { AdminButton } from './AdminUI';
import AdminDataTable from './AdminDataTable';

type DomainRow = CompanyEmailDomain & { id: string };
export default function CompanyEmailDomainsTable({
  domains,
  onToggle,
  search,
  disabled,
}: {
  domains: CompanyEmailDomain[];
  onToggle: (domain: CompanyEmailDomain, trigger: HTMLElement) => void;
  search: string;
  disabled: boolean;
}) {
  const data = useMemo(
    () => domains.map((domain) => ({ ...domain, id: domain.domain })),
    [domains],
  );
  const columns = useMemo<ColumnDef<DomainRow>[]>(
    () => [
      {
        id: 'identity',
        accessorFn: (item) => `${item.company} ${item.domain}`,
        header: '회사',
        cell: ({ row: { original: item } }) => (
          <>
            <strong>{item.company}</strong>
            <small>
              <a
                href={item.website}
                target="_blank"
                rel="noopener noreferrer"
                className="underline!"
              >
                공식 홈페이지
              </a>
            </small>
          </>
        ),
      },
      { accessorKey: 'domain', header: '도메인', enableGlobalFilter: false },
      {
        accessorKey: 'active',
        header: '상태',
        enableGlobalFilter: false,
        cell: ({ row }) => (row.original.active ? '자동 인증 사용 중' : '비활성'),
      },
      {
        accessorKey: 'updatedAt',
        header: '변경일',
        enableGlobalFilter: false,
        cell: ({ row }) => adminDate(row.original.updatedAt, true),
      },
      {
        id: 'actions',
        header: '관리',
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <AdminButton
            disabled={disabled}
            variant={row.original.active ? 'danger' : 'default'}
            className="min-h-0 rounded-[5px] px-[9px] py-[5px] text-[12px]"
            onClick={(event) => onToggle(row.original, event.currentTarget)}
          >
            {row.original.active ? '비활성화' : '활성화'}
          </AdminButton>
        ),
      },
    ],
    [onToggle, disabled],
  );
  return (
    <AdminDataTable
      data={data}
      columns={columns}
      search={search}
      columnFilters={[]}
      caption="승인된 기업 이메일 도메인"
    />
  );
}
