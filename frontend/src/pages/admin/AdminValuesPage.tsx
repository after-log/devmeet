import { useState } from 'react';
import { Plus } from 'lucide-react';
import { categories } from './mock';
import { useAdminMock } from './hooks/useAdminMock';
import { useTableFilters } from './hooks/useTableFilters';
import {
  AdminButton,
  EmptyState,
  OnlineDot,
  PageHeading,
  Pager,
  Panel,
  Tabs,
  Toolbar,
} from './components/AdminUI';
import QuestionsTable from './components/QuestionsTable';

export default function AdminValuesPage() {
  const { questions, openQuestion, toggleQuestion } = useAdminMock();
  const { search, filter, page, setSearch, setFilter, setPage } = useTableFilters();
  const [category, setCategory] = useState('ALL');
  const active = questions.filter((q) => q.active).length;
  const filtered = questions.filter(
    (q) =>
      `${q.text} ${q.id}`.toLowerCase().includes(search.toLowerCase()) &&
      (category === 'ALL' || q.section === category) &&
      (filter === 'ALL' || q.active === (filter === 'ACTIVE')),
  );
  const add = () => {
    setSearch('');
    setFilter('ALL');
    setCategory('ALL');
    openQuestion();
  };
  return (
    <>
      <PageHeading
        kicker="VALUE QUESTIONS"
        title="가치관 관리"
        description="서로를 알아가는 질문을 추가하고 활성 상태를 관리하세요."
      >
        <AdminButton
          variant="primary"
          className="max-sm:mt-5 max-sm:min-h-[35px] max-sm:px-2.5 max-sm:py-2 max-sm:text-[10px]"
          onClick={add}
        >
          <Plus size={17} /> 문항 추가
        </AdminButton>
      </PageHeading>
      <div className="mb-6 flex items-center gap-[26px] rounded-[10px] border border-[#e7e9f0] bg-white px-[23px] py-[17px] text-[11px] text-[#969ba8] max-xl:gap-[17px] max-sm:gap-[18px] max-sm:p-[15px] max-sm:text-[10px]">
        <span className="flex items-center gap-2">
          전체 문항 <b className="text-[15px] text-[#555e70]">{questions.length}</b>
        </span>
        <span className="flex items-center gap-2">
          <OnlineDot /> 활성 <b className="text-[15px] text-[#555e70]">{active}</b>
        </span>
        <span className="flex items-center gap-2">
          비활성 <b className="text-[15px] text-[#555e70]">{questions.length - active}</b>
        </span>
        <p className="ml-auto! text-[10px] text-[#abaeba] max-xl:hidden">
          활성화된 문항이 사용자에게 표시됩니다.
        </p>
      </div>
      <Panel>
        <Tabs
          inset
          options={[
            { value: 'ALL', label: '전체 분류' },
            ...categories.map((c) => ({ value: c.label, label: c.label })),
          ]}
          value={category}
          onChange={(value) => {
            setCategory(value);
            setPage(0);
          }}
        />
        <Toolbar
          inset
          search={search}
          onSearch={setSearch}
          filter={filter}
          onFilter={setFilter}
          placeholder="문항 내용 또는 문항 ID 검색"
          options={[
            ['ALL', '전체 상태'],
            ['ACTIVE', '활성'],
            ['INACTIVE', '비활성'],
          ]}
        />
        <QuestionsTable
          questions={filtered.slice(page * 8, page * 8 + 8)}
          onToggle={toggleQuestion}
        />
        {!filtered.length && <EmptyState />}
        <div className="px-6 max-sm:px-4">
          <Pager page={page} total={filtered.length} change={setPage} />
        </div>
      </Panel>
    </>
  );
}
