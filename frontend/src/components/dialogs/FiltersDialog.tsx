import { useDevmeetStore } from '../../stores/devmeet';
import { Select } from '../ui/select';
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
      <Select
        id="job-filter"
        disabled={role === 'other'}
        value={role === 'other' ? 'dev' : filter}
        onValueChange={(value) => onChange(value as Preference)}
        options={[
          { value: 'all', label: '직군 상관없어요' },
          { value: 'dev', label: '개발자' },
          { value: 'other', label: '비개발자' },
        ]}
      />
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
      <Select
        id="age-filter"
        defaultValue="27–35세"
        options={['27–35세', '19–26세', '36–50세', '19–50세']}
      />
      <label className="formlabel" htmlFor="distance-filter">
        거리
      </label>
      <Select
        id="distance-filter"
        defaultValue="50km 이내"
        options={['50km 이내', '10km 이내', '100km 이내', '500km 이내']}
      />
      <label className="formlabel" htmlFor="activity-filter">
        최근 접속
      </label>
      <Select
        id="activity-filter"
        defaultValue="10일 이내"
        options={['10일 이내', '24시간 이내', '3일 이내', '7일 이내']}
      />
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
