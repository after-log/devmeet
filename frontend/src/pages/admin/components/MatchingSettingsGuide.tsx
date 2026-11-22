import { Copy, ShieldCheck, Sliders } from 'lucide-react';
import { Panel } from './AdminUI';

export default function MatchingSettingsGuide() {
  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 max-[1000px]:grid-cols-1">
        <Panel>
          <div className="p-5">
            <h2 className="mb-2! flex items-center gap-2 text-sm font-semibold">
              <Sliders size={17} /> 매칭 우선순위란?
            </h2>
            <p className="text-sm leading-relaxed text-neutral-600">
              조건에 맞는 후보 중 누구를 먼저 추천할지 정하는 기준입니다. 가중치가 높은 항목이 더 큰
              영향을 주며, 가치관은 전체 활성 매칭 문항 중 일치하는 답변의 비율로 계산합니다. 미응답
              문항은 일치로 계산하지 않습니다.
            </p>
          </div>
        </Panel>
        <Panel>
          <div className="p-5">
            <h2 className="mb-2! flex items-center gap-2 text-sm font-semibold">
              <Copy size={17} /> 프리셋이란?
            </h2>
            <p className="text-sm leading-relaxed text-neutral-600">
              추천 항목과 가중치를 묶어 저장한 설정입니다. 저장과 적용은 별도이며, 수정하면 새
              버전으로 남습니다. 적용 후 새로 생성되는 추천부터 사용하고, 이전 버전을 다시 적용할
              수도 있습니다.
            </p>
          </div>
        </Panel>
      </div>
      <div className="mb-6 flex items-start gap-2 rounded-lg border border-neutral-200 bg-neutral-100 px-4 py-3 text-sm text-neutral-600">
        <ShieldCheck size={18} className="mt-0.5 shrink-0" />
        <p>
          회원의 나이·지역·선호 직군 조건과 사진 승인·차단·이용 제한 기준은 모든 프리셋에 공통
          적용됩니다. 하루 추천·좋아요 한도도 유지됩니다.
        </p>
      </div>
    </>
  );
}
