export default function CompanyEmailFeedback({
  error,
  notice,
  loading,
  refresh,
}: {
  error: string;
  notice: string;
  loading: boolean;
  refresh: () => void;
}) {
  return (
    <>
      {error && (
        <p role="alert" className="mb-4! rounded-lg bg-red-50 p-4 text-sm text-red-800">
          {error}
          <button disabled={loading} className="ml-3 underline" onClick={refresh}>
            다시 불러오기
          </button>
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4! rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
          {notice}
        </p>
      )}
      {loading && (
        <p role="status" className="mb-4! text-sm text-neutral-500">
          목록을 불러오는 중…
        </p>
      )}
    </>
  );
}
