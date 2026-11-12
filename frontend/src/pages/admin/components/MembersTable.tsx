import AdminPhoto from './AdminPhoto';
import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Member } from '../types';
import { AdminButton, Badge } from './AdminUI';
import AdminDataTable from './AdminDataTable';

export default function MembersTable({
  members,
  onDetail,
  search,
  status,
}: {
  members: Member[];
  onDetail: (member: Member) => void;
  search: string;
  status: string;
}) {
  const columns = useMemo<ColumnDef<Member>[]>(
    () => [
      {
        id: 'identity',
        accessorFn: (member) => `${member.name} ${member.email} ${member.id}`,
        header: '회원 정보',
        cell: ({ row: { original: member } }) => (
          <div className="flex items-center gap-2.5">
            <AdminPhoto
              className="h-[37px] w-[34px] rounded-md object-cover"
              src={member.photos[0]}
              alt=""
            />
            <div>
              <strong>
                {member.name}
                <span className="ml-[7px] text-[12px] text-neutral-600">{member.id}</span>
              </strong>
              <small>{member.email}</small>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: '직무 / 지역',
        enableGlobalFilter: false,
        cell: ({ row: { original: member } }) => (
          <>
            {member.role}
            <small>{member.region}</small>
          </>
        ),
      },
      { accessorKey: 'joined', header: '가입일', enableGlobalFilter: false },
      {
        accessorKey: 'review',
        header: '프로필 검수',
        enableGlobalFilter: false,
        cell: ({ row }) => <Badge status={row.original.review} />,
      },
      {
        id: 'status',
        accessorFn: (member) => (member.suspended ? 'SUSPENDED' : 'NORMAL'),
        header: '계정 상태',
        enableGlobalFilter: false,
        filterFn: 'equalsString',
        cell: ({ row: { original: member } }) => (
          <Badge status={member.suspended ? 'REJECTED' : 'APPROVED'}>
            {member.suspended ? '이용 제한' : '정상'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '관리',
        cell: ({ row }) => (
          <AdminButton
            className="min-h-0 rounded-[5px] border-[#e5e5e5] px-[9px] py-[5px] text-[12px] text-neutral-600"
            onClick={() => onDetail(row.original)}
          >
            상세 보기
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
      data={members}
      columns={columns}
      search={search}
      columnFilters={columnFilters}
      caption="가입 회원 목록"
    />
  );
}
