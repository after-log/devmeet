import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Member } from '../mock';
import { useAdminMock } from '../hooks/useAdminMock';
import {
  AdminButton,
  Badge,
  Field,
  Guidance,
  Modal,
  ModalActions,
  TextArea,
} from '../components/AdminUI';

export default function ProfileReviewDialog({ member }: { member: Member }) {
  const { closeDialog, reviewProfile } = useAdminMock();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [reason, setReason] = useState('');
  return (
    <Modal
      title="프로필 검수"
      description={`${member.name} · ${member.id} · 등록 ${member.joined}`}
      close={closeDialog}
    >
      <div className="grid grid-cols-2 gap-[25px] max-sm:grid-cols-1">
        <div>
          <img
            className="h-80 w-full rounded-[9px] bg-[#f5f5f5] object-cover max-sm:h-[300px]"
            src={member.photos[photoIndex]}
            alt={`${member.name} 등록 사진 ${photoIndex + 1}`}
          />
          <div className="mt-2.5 flex gap-[9px]">
            {member.photos.map((src, i) => (
              <button
                key={src}
                className={cn(
                  'h-[62px] w-14 rounded-md bg-white p-0.5',
                  i === photoIndex ? 'border-2 border-[#404040]' : 'border border-[#e5e5e5]',
                )}
                onClick={() => setPhotoIndex(i)}
                aria-label={`사진 ${i + 1} 확인`}
              >
                <img
                  className="size-full rounded-[3px] object-cover"
                  src={src}
                  alt={`등록 사진 ${i + 1}`}
                />
              </button>
            ))}
          </div>
          <p className="mt-2.5! text-[10px] text-[#a3a3a3]">
            mock 이미지 3장은 동일 인물의 예시 사진입니다.
          </p>
        </div>
        <div>
          <Badge status={member.review} />
          <h3 className="mt-[13px]! mb-1.5! text-[21px] font-semibold max-sm:text-[19px]">
            {member.name}{' '}
            <small className="text-xs font-normal text-[#a3a3a3]">{member.age}세</small>
          </h3>
          <p className="text-xs text-[#a3a3a3]">
            {member.role}
            <br />
            {member.region}
          </p>
          <Guidance title="사진 검수 기준">
            <ul className="mt-[9px] mb-0 list-disc pl-[15px] leading-[1.9]">
              <li>본인의 얼굴을 명확하게 확인할 수 있나요?</li>
              <li>부적절하거나 타인의 사진이 아닌가요?</li>
              <li>등록한 사진 3장을 모두 확인해 주세요.</li>
            </ul>
          </Guidance>
          {member.reason && (
            <p className="mt-2.5! text-[10px] text-[#a3a3a3]">이전 반려 사유: {member.reason}</p>
          )}
          <Field label="검수 사유" hint="불합격 시 필수">
            <TextArea
              maxLength={500}
              placeholder="수정이 필요한 부분을 구체적으로 적어 주세요."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
          <ModalActions>
            <AdminButton
              variant="danger"
              disabled={!reason.trim()}
              onClick={() => reviewProfile(member, 'REJECTED', reason)}
            >
              <X size={16} /> 불합격
            </AdminButton>
            <AdminButton
              variant="primary"
              onClick={() => reviewProfile(member, 'APPROVED', reason)}
            >
              <Check size={16} /> 합격
            </AdminButton>
          </ModalActions>
        </div>
      </div>
    </Modal>
  );
}
