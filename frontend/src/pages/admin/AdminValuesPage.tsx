import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAdmin } from './hooks/useAdmin';
import { AdminButton, OnlineDot, Panel, Tabs, StatusTabs, Toolbar } from './components/AdminUI';
import QuestionsTable from './components/QuestionsTable';

export default function AdminValuesPage() {
  const { questions, categories, openQuestion, toggleQuestion } = useAdmin();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const active = questions.filter((q) => q.active).length;
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-[26px] rounded-[10px] border border-[#e5e5e5] bg-white px-[23px] py-[17px] text-[13px] text-neutral-600 max-xl:gap-[17px] max-sm:gap-[18px] max-sm:p-[15px] max-sm:text-[12px]">
        <span className="flex items-center gap-2">
          전체 문항 <b className="text-[15px] text-neutral-700">{questions.length}</b>
        </span>
        <span className="flex items-center gap-2">
          <OnlineDot /> 활성 <b className="text-[15px] text-neutral-700">{active}</b>
        </span>
        <span className="flex items-center gap-2">
          비활성 <b className="text-[15px] text-neutral-700">{questions.length - active}</b>
        </span>
        <p className="ml-auto! text-[12px] text-neutral-600 max-xl:hidden">
          활성화된 문항이 사용자에게 표시됩니다.
        </p>
        <AdminButton
          variant="primary"
          className="ml-auto"
          onClick={() => {
            setSearch('');
            setStatus('ALL');
            setCategory('ALL');
            openQuestion();
          }}
        >
          <Plus size={16} /> 문항 추가
        </AdminButton>
      </div>
      <Panel>
        <Tabs
          inset
          options={[
            { value: 'ALL', label: '전체 분류' },
            ...categories.map((c) => ({ value: c.label, label: c.label })),
          ]}
          value={category}
          onChange={setCategory}
        />
        <Toolbar
          inset
          search={search}
          onSearch={setSearch}
          placeholder="문항 내용 또는 문항 ID 검색"
        >
          <StatusTabs
            options={[
              { value: 'ALL', label: '전체', count: questions.length },
              { value: 'ACTIVE', label: '활성', count: active },
              { value: 'INACTIVE', label: '비활성', count: questions.length - active },
            ]}
            value={status}
            onChange={setStatus}
          />
        </Toolbar>
        <QuestionsTable
          questions={questions}
          onToggle={toggleQuestion}
          search={search}
          status={status}
          category={category}
        />
      </Panel>
    </>
  );
}
