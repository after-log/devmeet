import { useState } from 'react';
import { adminApi } from '../api';
import { Field } from '../components/AdminUI';
import CompanyEmailActionDialog, {
  type CompanyEmailDialogCallbacks,
} from './CompanyEmailActionDialog';

export default function CompanyDomainRegisterDialog(callbacks: CompanyEmailDialogCallbacks) {
  const [company, setCompany] = useState('');
  const [domain, setDomain] = useState('');
  const [website, setWebsite] = useState('');
  const field =
    'mt-2 block w-full rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-800';
  return (
    <CompanyEmailActionDialog
      {...callbacks}
      title="기업 도메인 등록"
      description="회사와 도메인의 관계를 직접 확인한 결과를 기록해 주세요."
      submitLabel="도메인 승인 및 등록"
      onSubmit={(note) =>
        adminApi.registerCompanyDomain({
          company: company.trim(),
          domain: domain.trim(),
          website: website.trim(),
          note,
        })
      }
    >
      <Field label="회사명">
        <input
          required
          maxLength={100}
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          className={field}
        />
      </Field>
      <Field label="이메일 도메인">
        <input
          required
          maxLength={253}
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
          placeholder="company.com"
          className={field}
        />
      </Field>
      <Field label="공식 홈페이지">
        <input
          type="url"
          required
          maxLength={500}
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          placeholder="https://company.com"
          className={field}
        />
      </Field>
      <p className="mt-4! text-sm text-neutral-600">
        정확히 일치하는 이메일 도메인만 자동 승인합니다. 하위 도메인은 별도로 등록해야 합니다.
        알려진 공용·임시 메일 도메인은 등록할 수 없습니다.
      </p>
    </CompanyEmailActionDialog>
  );
}
