import { useState } from 'react';
import type { Report } from '../mock';
import { useAdminMock } from '../hooks/useAdminMock';
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
  const { closeDialog, reviewReport } = useAdminMock();
  const [note, setNote] = useState(report.note);
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
          value={note}
          readOnly={report.status !== 'OPEN'}
          placeholder="확인한 내용과 처리 사유를 입력해 주세요."
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
      {report.status === 'OPEN' && (
        <ModalActions>
          <AdminButton
            disabled={!note.trim()}
            onClick={() => reviewReport(report, 'DISMISSED', note)}
          >
            신고 기각
          </AdminButton>
          <AdminButton
            variant="primary"
            disabled={!note.trim()}
            onClick={() => reviewReport(report, 'VALID', note)}
          >
            유효 신고로 처리
          </AdminButton>
        </ModalActions>
      )}
    </Modal>
  );
}
