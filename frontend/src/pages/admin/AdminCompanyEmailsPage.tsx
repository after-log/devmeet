import { useCallback, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import useCompanyEmails from './hooks/useCompanyEmails';
import { AdminButton, Panel } from './components/AdminUI';
import CompanyEmailOverview from './components/CompanyEmailOverview';
import CompanyEmailFeedback from './components/CompanyEmailFeedback';
import CompanyEmailToolbar, { type CompanyEmailTab } from './components/CompanyEmailToolbar';
import CompanyEmailRequestsTable from './components/CompanyEmailRequestsTable';
import CompanyEmailDomainsTable from './components/CompanyEmailDomainsTable';
import CompanyEmailDialogs, { type CompanyEmailDialog } from './dialogs/CompanyEmailDialogs';
import type { CompanyEmailDomain, CompanyEmailRequest } from './types';

export default function AdminCompanyEmailsPage() {
  const { data, loading, error, notice, refresh, saved } = useCompanyEmails();
  const [tab, setTab] = useState<CompanyEmailTab>('requests');
  const [status, setStatus] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<CompanyEmailDialog | null>(null);
  const pageHeading = useRef<HTMLHeadingElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const open = useCallback((value: CompanyEmailDialog, button: HTMLElement) => {
    trigger.current = button;
    setDialog(value);
  }, []);
  const openReview = useCallback(
    (item: CompanyEmailRequest, button: HTMLElement) => open({ type: 'review', item }, button),
    [open],
  );
  const openActivation = useCallback(
    (item: CompanyEmailDomain, button: HTMLElement) => open({ type: 'toggle', item }, button),
    [open],
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 ref={pageHeading} tabIndex={-1} className="text-xl font-semibold">
            기업 이메일 인증
          </h1>
          <p className="mt-1! text-sm text-neutral-600">
            미등록 기업과 개인 메일 사용자의 소속을 검토하고, 확인된 기업 도메인을 관리하세요.
          </p>
        </div>
        <AdminButton
          disabled={!data}
          onClick={(event) => open({ type: 'register' }, event.currentTarget)}
        >
          <Plus size={16} /> 기업 도메인 등록
        </AdminButton>
      </div>
      <CompanyEmailOverview data={data} />
      <CompanyEmailFeedback error={error} notice={notice} loading={loading} refresh={refresh} />
      <Panel>
        <CompanyEmailToolbar
          tab={tab}
          onTabChange={(value) => {
            setTab(value);
            setSearch('');
          }}
          search={search}
          onSearch={setSearch}
          status={status}
          onStatusChange={setStatus}
        />
        {tab === 'requests' ? (
          <CompanyEmailRequestsTable
            requests={data?.requests ?? []}
            onDetail={openReview}
            search={search}
            status={status}
            disabled={loading}
          />
        ) : (
          <CompanyEmailDomainsTable
            domains={data?.domains ?? []}
            onToggle={openActivation}
            search={search}
            disabled={loading}
          />
        )}
      </Panel>
      <CompanyEmailDialogs
        dialog={dialog}
        close={() => setDialog(null)}
        saved={() => {
          setDialog(null);
          saved();
        }}
        restoreFocus={() => {
          if (trigger.current?.isConnected) trigger.current.focus();
          else pageHeading.current?.focus();
        }}
      />
    </>
  );
}
