import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminMock } from './hooks/useAdminMock';
import { PageHeading, Panel, StatusTabs, Tabs, Toolbar } from './components/AdminUI';
import MembersTable from './components/MembersTable';
import ReportsTable from './components/ReportsTable';

function MemberRecords({ isReports }: { isReports: boolean }) {
  const { members, reports, openMember, openReport } = useAdminMock();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const options = isReports
    ? [
        { value: 'ALL', label: '전체', count: reports.length },
        ...['OPEN', 'VALID', 'DISMISSED'].map((value) => ({
          value,
          label: (
            { OPEN: '미처리', VALID: '처리 완료', DISMISSED: '기각' } as Record<string, string>
          )[value],
          count: reports.filter((report) => report.status === value).length,
        })),
      ]
    : [
        { value: 'ALL', label: '전체', count: members.length },
        {
          value: 'NORMAL',
          label: '정상',
          count: members.filter((member) => !member.suspended).length,
        },
        {
          value: 'SUSPENDED',
          label: '이용 제한',
          count: members.filter((member) => member.suspended).length,
        },
      ];
  return (
    <>
      <Toolbar
        inset
        search={search}
        onSearch={setSearch}
        placeholder={
          isReports ? '신고자, 대상 회원 또는 신고 사유 검색' : '이름, 이메일 또는 회원 ID 검색'
        }
      >
        <StatusTabs options={options} value={status} onChange={setStatus} />
      </Toolbar>
      {isReports ? (
        <ReportsTable reports={reports} onDetail={openReport} search={search} status={status} />
      ) : (
        <MembersTable members={members} onDetail={openMember} search={search} status={status} />
      )}
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
