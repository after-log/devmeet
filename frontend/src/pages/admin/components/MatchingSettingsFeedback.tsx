import { RefreshCw } from 'lucide-react';

export default function MatchingSettingsFeedback({
  error,
  notice,
  loading,
  busy,
  refresh,
}: {
  error: string;
  notice: string;
  loading: boolean;
  busy: boolean;
  refresh: () => void;
}) {
  return (
    <>
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
          <button className="ml-3 underline" disabled={busy || loading} onClick={refresh}>
            다시 불러오기
          </button>
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {notice}
        </div>
      )}
      {loading && (
        <p role="status" className="mb-4! flex items-center gap-2 text-sm text-neutral-500">
          <RefreshCw size={15} className="animate-spin motion-reduce:animate-none" /> 매칭 설정을
          불러오는 중…
        </p>
      )}
    </>
  );
}
