import AdminPhoto from '../components/AdminPhoto';
import { useState } from 'react';
import type { Member } from '../types';
import { useAdmin } from '../hooks/useAdmin';
import {
  AdminButton,
  Badge,
  DetailList,
  Field,
  Modal,
  ModalActions,
  TextArea,
} from '../components/AdminUI';

export default function MemberDetailDialog({ member }: { member: Member }) {
  const { closeDialog, openReview, toggleSuspension } = useAdmin();
  const [reason, setReason] = useState('');
  return (
    <Modal
      title="회원 상세"
      description={`${member.id} · 가입 ${member.joined}`}
      close={closeDialog}
    >
      <div className="flex items-center gap-[17px]">
        <AdminPhoto
          className="h-[85px] w-[75px] rounded-[9px] object-cover"
          src={member.photos[0]}
          alt={member.name}
        />
        <div>
          <h3 className="text-lg font-semibold">{member.name}</h3>
          <p className="mt-[3px]! mb-[7px]! text-[13px] text-neutral-600">{member.email}</p>
          <Badge status={member.suspended ? 'REJECTED' : 'APPROVED'}>
            {member.suspended ? '이용 제한' : '정상 회원'}
          </Badge>
        </div>
      </div>
      <DetailList
        items={[
          ['직무', member.role],
          ['나이 / 지역', member.hasProfile ? `${member.age}세 / ${member.region}` : '미등록'],
          ['프로필 검수', <Badge status={member.review} />],
        ]}
      />
      <Field label={member.suspended ? '이용 제한 해제 사유' : '이용 제한 사유'}>
        <TextArea
          maxLength={1000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="처리 사유를 입력해 주세요."
        />
      </Field>
      <ModalActions>
        <AdminButton disabled={!member.hasProfile} onClick={() => openReview(member)}>
          프로필 사진 확인
        </AdminButton>
        <AdminButton
          variant={member.suspended ? 'primary' : 'danger'}
          disabled={!reason.trim()}
          onClick={() => toggleSuspension(member, reason)}
        >
          {member.suspended ? '이용 제한 해제' : '이용 제한'}
        </AdminButton>
      </ModalActions>
    </Modal>
  );
}
