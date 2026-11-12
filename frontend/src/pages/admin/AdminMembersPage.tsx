import { useSearchParams } from 'react-router-dom';
import { useAdminMock } from './hooks/useAdminMock';
import { useTableFilters } from './hooks/useTableFilters';
import { EmptyState, PageHeading, Pager, Panel, Tabs, Toolbar } from './components/AdminUI';
import MembersTable from './components/MembersTable';
import ReportsTable from './components/ReportsTable';

function MemberRecords({ isReports }: { isReports: boolean }) {
  const { members, reports, openMember, openReport } = useAdminMock();
  const { search, filter, page, setSearch, setFilter, setPage } = useTableFilters();
  const filteredMembers = members.filter(
    (m) =>
      `${m.name} ${m.email} ${m.id}`.toLowerCase().includes(search.toLowerCase()) &&
      (filter === 'ALL' || (filter === 'SUSPENDED' ? m.suspended : !m.suspended)),
  );
  const filteredReports = reports.filter(
    (r) =>
      `${r.sender} ${r.target} ${r.reason} ${r.id}`.toLowerCase().includes(search.toLowerCase()) &&
      (filter === 'ALL' || r.status === filter),
  );
  const total = isReports ? filteredReports.length : filteredMembers.length;
  return (
    <>
      <Toolbar
        inset
        search={search}
        onSearch={setSearch}
        filter={filter}
        onFilter={setFilter}
        placeholder={
          isReports ? '신고자, 대상 회원 또는 신고 사유 검색' : '이름, 이메일 또는 회원 ID 검색'
        }
        options={
          isReports
            ? [
                ['ALL', '전체 상태'],
                ['OPEN', '미처리'],
                ['VALID', '처리 완료'],
                ['DISMISSED', '기각'],
              ]
            : [
                ['ALL', '전체 상태'],
                ['NORMAL', '정상'],
                ['SUSPENDED', '이용 제한'],
              ]
        }
      />
      {isReports ? (
        <ReportsTable
          reports={filteredReports.slice(page * 8, page * 8 + 8)}
          onDetail={openReport}
        />
      ) : (
        <MembersTable
          members={filteredMembers.slice(page * 8, page * 8 + 8)}
          onDetail={openMember}
        />
      )}
      {!total && <EmptyState />}
      <div className="px-6 max-sm:px-4">
        <Pager page={page} total={total} change={setPage} />
      </div>
    </>
  );
}
export default function AdminMembersPage() {
  const { members, reports } = useAdminMock();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'reports' ? 'reports' : 'members';
  return (
    <>
      <PageHeading
        kicker="MEMBER MANAGEMENT"
        title="회원 관리"
        description="가입 회원과 신고 내역을 한곳에서 관리하세요."
      />
      <Panel>
        <Tabs
          inset
          options={[
            { value: 'members', label: '가입 유저', count: members.length },
            { value: 'reports', label: '신고 내역', count: reports.length },
          ]}
          value={tab}
          onChange={(value) => setParams(value === 'reports' ? { tab: 'reports' } : {})}
        />
        <MemberRecords key={tab} isReports={tab === 'reports'} />
      </Panel>
    </>
  );
}
