import { Info } from 'lucide-react';
import type { MatchingSettings } from '../types';
import { Panel } from './AdminUI';
import MatchingPresetPerformanceTable from './MatchingPresetPerformanceTable';

export default function MatchingPresetPerformance({ data }: { data: MatchingSettings | null }) {
  return (
    <section aria-labelledby="preset-performance-title">
      <div className="mb-4">
        <h2 id="preset-performance-title" className="text-base font-semibold">
          프리셋별 연결 성과
        </h2>
        <p className="mt-1! text-sm text-neutral-600">
          최근 30일에 배정한 추천 중 7일의 관찰 기간이 끝난 추천을 비교합니다.
        </p>
      </div>
      <Panel className="pt-4">
        <MatchingPresetPerformanceTable
          presets={data?.presets ?? []}
          performance={data?.performance ?? []}
        />
      </Panel>
      <div className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-neutral-500">
        <Info size={15} className="mt-0.5 shrink-0" />
        <p>
          전환율은 실제 조회가 아닌 추천 배정 건수를 기준으로, 배정 후 7일 이내 보낸 좋아요와 상호
          매칭을 집계합니다. 같은 상대를 다른 날 추천한 경우 별도 배정 건으로 계산합니다. 설정 도입
          전 추천은 제외합니다. 무작위 A/B 실험 결과가 아니므로 회원 구성과 적용 시기에 따라 차이가
          날 수 있습니다.
        </p>
      </div>
    </section>
  );
}
