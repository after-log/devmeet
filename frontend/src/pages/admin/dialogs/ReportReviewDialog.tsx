import { useSchemaForm } from '@/hooks/useSchemaForm';
import { reportReviewSchema } from '@/validation/admin';
import { FormErrors } from '@/components/ui/form-errors';
import type { Report } from '../types';
import { useAdmin } from '../hooks/useAdmin';
import {
  AdminButton,
  Badge,
  DetailList,
  Field,
  Guidance,
  Modal,
  ModalActions,
  TextArea,
} from '../components/AdminUI';

export default function ReportReviewDialog({ report }: { report: Report }) {
  const { closeDialog, reviewReport } = useAdmin();
  const form = useSchemaForm(reportReviewSchema, {
    defaultValues: { status: 'VALID', note: report.note },
  });
  const submitReview = (status: 'VALID' | 'DISMISSED') => {
    form.setValue('status', status);
    void form.handleSubmit((input) => reviewReport(report, input.status, input.note))();
  };
  return (
    <Modal title="신고 내역 확인" description={`${report.id} · ${report.date}`} close={closeDialog}>
      <Badge status={report.status} />
      <DetailList
        items={[
          ['신고자', report.sender],
          ['대상 회원', report.target],
          ['신고 사유', report.reason],
        ]}
      />
      <Guidance title="접수 내용">
        <p className="mt-2! leading-[1.9]">{report.detail}</p>
      </Guidance>
      <Field label="검토 메모">
        <TextArea
          maxLength={1000}
          {...form.register('note')}
          readOnly={report.status !== 'OPEN'}
          placeholder="확인한 내용과 처리 사유를 입력해 주세요."
        />
      </Field>
      <FormErrors errors={form.formState.errors} className="mt-3 text-sm text-red-700" />
      {report.status === 'OPEN' && (
        <ModalActions>
          <AdminButton
            disabled={form.formState.isSubmitting}
            onClick={() => submitReview('DISMISSED')}
          >
            신고 기각
          </AdminButton>
          <AdminButton
            variant="primary"
            disabled={form.formState.isSubmitting}
            onClick={() => submitReview('VALID')}
          >
            유효 신고로 처리
          </AdminButton>
        </ModalActions>
      )}
    </Modal>
  );
}
