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
}) => (
  <>
    <p className="eyebrow">// preferences</p>
    <DialogTitle>어떤 연결을 원하세요?</DialogTitle>
    <label className="formlabel" htmlFor="job-filter">
      만나고 싶은 사람
    </label>
    <select id="job-filter" value={filter} onChange={(e) => onChange(e.target.value as Preference)}>
      <option value="all">직군 상관없어요</option>
      <option value="dev">개발자</option>
      <option value="other">비개발자</option>
    </select>
    <DialogDescription className="secure mt-[25px]">
      직업 인증과 함께 연애관, 일상의 취향을 살펴 추천해요.
    </DialogDescription>
    <button className="btn full" onClick={onApply}>
      추천에 반영하기
    </button>
  </>
);
export default FiltersDialog;
