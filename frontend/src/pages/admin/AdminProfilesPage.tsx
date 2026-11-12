import { useAdmin } from './hooks/useAdmin';
import { useTableFilters } from './hooks/useTableFilters';
import { EmptyState, Pager, ResultCount, reviewLabels, Tabs, Toolbar } from './components/AdminUI';
import ProfileCard from './components/ProfileCard';

export default function AdminProfilesPage() {
  const { members: allMembers, openReview } = useAdmin();
  const members = allMembers.filter((member) => member.hasProfile);
  const { search, filter, page, setSearch, setFilter, setPage } = useTableFilters();
  const filtered = members.filter(
    (m) =>
      `${m.name} ${m.email} ${m.id}`.toLowerCase().includes(search.toLowerCase()) &&
      (filter === 'ALL' || m.review === filter),
  );
  return (
    <>
      <Tabs
        options={['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => ({
          value: status,
          label: status === 'ALL' ? '전체 프로필' : reviewLabels[status],
          count:
            status === 'ALL' ? members.length : members.filter((m) => m.review === status).length,
        }))}
        value={filter}
        onChange={setFilter}
      />
      <Toolbar search={search} onSearch={setSearch} placeholder="이름, 이메일 또는 회원 ID 검색">
        <ResultCount total={filtered.length} allTotal={members.length} />
      </Toolbar>
      <div className="grid grid-cols-4 gap-[19px] max-[900px]:grid-cols-2 max-xl:grid-cols-3 max-sm:gap-[11px]">
        {filtered.slice(page * 8, page * 8 + 8).map((member) => (
          <ProfileCard key={member.id} member={member} onReview={openReview} />
        ))}
      </div>
      {!filtered.length && <EmptyState />}
      <Pager page={page} total={filtered.length} change={setPage} />
    </>
  );
}
