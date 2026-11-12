import type { Report } from '../mock';
import { AdminButton, AdminTable, Badge } from './AdminUI';

export default function ReportsTable({
  reports,
  onDetail,
}: {
  reports: Report[];
  onDetail: (report: Report) => void;
}) {
  return (
    <AdminTable>
      <thead>
        <tr>
          <th>신고 번호 / 접수일</th>
          <th>신고자</th>
          <th>대상 회원</th>
          <th>신고 사유</th>
          <th>처리 상태</th>
          <th>관리</th>
        </tr>
      </thead>
      <tbody>
        {reports.map((report) => (
          <tr key={report.id}>
            <td>
              <strong>{report.id}</strong>
              <small>{report.date}</small>
            </td>
            <td>{report.sender}</td>
            <td>{report.target}</td>
            <td>{report.reason}</td>
            <td>
              <Badge status={report.status} />
            </td>
            <td>
              <AdminButton
                className="min-h-0 rounded-[5px] border-[#e8e9ef] px-[9px] py-[5px] text-[10px] text-[#8a839a]"
                onClick={() => onDetail(report)}
              >
                신고 확인
              </AdminButton>
            </td>
          </tr>
        ))}
      </tbody>
    </AdminTable>
  );
}
