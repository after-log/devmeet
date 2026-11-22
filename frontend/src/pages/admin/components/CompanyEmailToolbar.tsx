import { companyEmailStatusLabels } from '../companyEmail';
import { Tabs, Toolbar } from './AdminUI';

export type CompanyEmailTab = 'requests' | 'domains';
export default function CompanyEmailToolbar({
  tab,
  onTabChange,
  search,
  onSearch,
  status,
  onStatusChange,
}: {
  tab: CompanyEmailTab;
  onTabChange: (tab: CompanyEmailTab) => void;
  search: string;
  onSearch: (search: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
}) {
  return (
    <>
      <Tabs
        inset
        value={tab}
        onChange={(value) => onTabChange(value === 'domains' ? 'domains' : 'requests')}
        options={[
          { value: 'requests', label: '검토 요청' },
          { value: 'domains', label: '승인 도메인' },
        ]}
      />
      <Toolbar
        inset
        search={search}
        onSearch={onSearch}
        placeholder={
          tab === 'requests' ? '회사, 회원 이름 또는 이메일 검색' : '회사 또는 도메인 검색'
        }
      >
        {tab === 'requests' && (
          <select
            aria-label="검토 상태"
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="w-auto rounded-lg border border-neutral-200 bg-white p-2.5 text-sm text-neutral-800"
          >
            <option value="ALL">전체 상태</option>
            {Object.entries(companyEmailStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        )}
      </Toolbar>
    </>
  );
}
