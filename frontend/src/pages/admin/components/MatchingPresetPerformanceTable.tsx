import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { MatchingPreset, MatchingSettings } from '../types';
import AdminDataTable from './AdminDataTable';

type PerformanceRow = MatchingPreset & { stats?: MatchingSettings['performance'][number] };
const number = new Intl.NumberFormat('ko-KR');
const rate = (count: number, total: number) =>
  total ? `${((count / total) * 100).toFixed(1)}%` : '—';

export default function MatchingPresetPerformanceTable({
  presets,
  performance,
}: {
  presets: MatchingPreset[];
  performance: MatchingSettings['performance'];
}) {
  const data = useMemo(() => {
    const stats = new Map(performance.map((item) => [item.presetId, item]));
    return presets.map((preset) => ({ ...preset, stats: stats.get(preset.id) }));
  }, [presets, performance]);
  const columns = useMemo<ColumnDef<PerformanceRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: '프리셋',
        cell: ({ row: { original: preset } }) => (
          <>
            <strong>{preset.name}</strong>
            <span className="ml-2 text-xs text-neutral-500">v{preset.version}</span>
            {preset.deletedAt && (
              <span className="ml-2 rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-500">
                삭제됨
              </span>
            )}
          </>
        ),
      },
      {
        id: 'members',
        header: '회원 수',
        cell: ({ row }) => (
          <span className="tabular-nums">{number.format(row.original.stats?.members ?? 0)}명</span>
        ),
      },
      {
        id: 'recommendations',
        header: '추천 건수',
        cell: ({ row }) => (
          <span className="tabular-nums">
            {number.format(row.original.stats?.recommendations ?? 0)}건
          </span>
        ),
      },
      {
        id: 'likes',
        header: '좋아요 전환',
        cell: ({
          row: {
            original: { stats },
          },
        }) => (
          <span className="tabular-nums">
            {rate(stats?.likes ?? 0, stats?.recommendations ?? 0)}
            <small>{number.format(stats?.likes ?? 0)}건</small>
          </span>
        ),
      },
      {
        id: 'matches',
        header: '매칭 전환',
        cell: ({
          row: {
            original: { stats },
          },
        }) => (
          <span className="tabular-nums">
            {rate(stats?.matches ?? 0, stats?.recommendations ?? 0)}
            <small>
              {stats?.recommendations ? `${number.format(stats.matches)}건` : '관찰 데이터 대기'}
            </small>
          </span>
        ),
      },
    ],
    [],
  );
  return (
    <AdminDataTable
      data={data}
      columns={columns}
      search=""
      columnFilters={[]}
      caption="프리셋 성과 목록"
    />
  );
}
