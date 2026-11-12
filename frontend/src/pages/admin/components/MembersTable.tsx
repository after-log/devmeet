import type { Member } from '../mock';
import { AdminButton, AdminTable, Badge } from './AdminUI';

export default function MembersTable({
  members,
  onDetail,
}: {
  members: Member[];
  onDetail: (member: Member) => void;
}) {
  return (
    <AdminTable>
      <thead>
        <tr>
          <th>회원 정보</th>
          <th>직무 / 지역</th>
          <th>가입일</th>
          <th>프로필 검수</th>
          <th>계정 상태</th>
          <th>관리</th>
        </tr>
      </thead>
      <tbody>
        {members.map((member) => (
          <tr key={member.id}>
            <td>
              <div className="flex items-center gap-2.5">
                <img
                  className="h-[37px] w-[34px] rounded-md object-cover"
                  src={member.photos[0]}
                  alt=""
                />
                <div>
                  <strong>
                    {member.name}
                    <span className="ml-[7px] text-[8px] text-[#b0b3bd]">{member.id}</span>
                  </strong>
                  <small>{member.email}</small>
                </div>
              </div>
            </td>
            <td>
              {member.role}
              <small>{member.region}</small>
            </td>
            <td>{member.joined}</td>
            <td>
              <Badge status={member.review} />
            </td>
            <td>
              <Badge status={member.suspended ? 'REJECTED' : 'APPROVED'}>
                {member.suspended ? '이용 제한' : '정상'}
              </Badge>
            </td>
            <td>
              <AdminButton
                className="min-h-0 rounded-[5px] border-[#e8e9ef] px-[9px] py-[5px] text-[10px] text-[#8a839a]"
                onClick={() => onDetail(member)}
              >
                상세 보기
              </AdminButton>
            </td>
          </tr>
        ))}
      </tbody>
    </AdminTable>
  );
}
