import { useDevmeetStore } from '../../stores/devmeet';
import type { Preference } from '../../types';
import { DialogTitle, DialogDescription } from '../ui/dialog';

const FiltersDialog = ({
  filter,
  onChange,
  onApply,
}: {
  filter: Preference;
  onChange: (filter: Preference) => void;
  onApply: () => void;
}) => {
  const role = useDevmeetStore((s) => s.profile.role);
  return (
    <>
      <p className="eyebrow">// preferences</p>
      <DialogTitle>어떤 연결을 원하세요?</DialogTitle>
      <label className="formlabel" htmlFor="job-filter">
        만나고 싶은 사람
      </label>
      <select
        id="job-filter"
        disabled={role === 'other'}
        value={role === 'other' ? 'dev' : filter}
        onChange={(e) => onChange(e.target.value as Preference)}
      >
        <option value="all">직군 상관없어요</option>
        <option value="dev">개발자</option>
        <option value="other">비개발자</option>
      </select>
      <label className="formlabel" htmlFor="region-filter">
        지역 · 중복 선택
      </label>
      <div className="flex gap-5 text-xs">
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked className="!min-h-4 !w-4" />
          서울 전체
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked className="!min-h-4 !w-4" />
          경기 전체
        </label>
      </div>
      <label className="formlabel" htmlFor="age-filter">
        나이 범위
      </label>
      <select id="age-filter">
        <option>27–35세</option>
        <option>19–26세</option>
        <option>36–50세</option>
        <option>19–50세</option>
      </select>
      <label className="formlabel" htmlFor="distance-filter">
        거리
      </label>
      <select id="distance-filter">
        <option>50km 이내</option>
        <option>10km 이내</option>
        <option>100km 이내</option>
        <option>500km 이내</option>
      </select>
      <label className="formlabel" htmlFor="activity-filter">
        최근 접속
      </label>
      <select id="activity-filter">
        <option>10일 이내</option>
        <option>24시간 이내</option>
        <option>3일 이내</option>
        <option>7일 이내</option>
      </select>
      <DialogDescription className="secure mt-[25px]">
        직군 필터는 데모 카드에 적용됩니다. 지역·나이·거리·접속 조건은 UI 체험이며 추천에 적용되지
        않습니다.
      </DialogDescription>
      <button className="btn full" onClick={onApply}>
        추천에 반영하기
      </button>
    </>
  );
};
export default FiltersDialog;
