import { useCallback, useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { request } from '@/lib/api';
import { useApp } from '@/stores/app';
import { toast } from 'sonner';

type Dashboard = {
  counts: Record<string, number>;
  photos: { id: string; name: string; photo: string; status: string }[];
  reports: { id: string; senderId: string; targetId: string; reason: string; status: string }[];
  pool: { role: string; count: number }[];
};
const AdminPage = () => {
  const user = useApp((s) => s.user);
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [target, setTarget] = useState('');
  const [suspensionReason, setSuspensionReason] = useState('');
  const load = useCallback(async () => {
    try {
      setData(await request<Dashboard>('/admin?page=' + page));
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }, [page]);
  useEffect(() => {
    if (user?.admin) void load();
  }, [user?.admin, load]);
  if (!user?.admin) return <Navigate to="/" replace />;
  const act = async (path: string, body: unknown) => {
    setBusy(true);
    try {
      await request(path, 'PUT', body);
      await load();
      toast('처리했어요.');
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <p className="eyebrow">// admin</p>
      <h2>운영자 관리</h2>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!data ? (
        <p>불러오는 중…</p>
      ) : (
        <>
          <div className="panel">
            <h3>서비스 현황</h3>
            {Object.entries(data.counts).map(([key, value]) => (
              <div className="info-row" key={key}>
                <span>
                  {
                    (
                      {
                        accounts: '가입 회원',
                        profiles: '프로필',
                        recommendations: '추천 노출',
                        likes: '좋아요',
                        matches: '매칭',
                        messages: '메시지',
                        reports: '신고',
                      } as Record<string, string>
                    )[key]
                  }
                </span>
                <strong>{value}</strong>
              </div>
            ))}
            {data.pool.map((item) => (
              <p key={item.role} className="text-xs text-fg-3">
                {item.role === 'developer' ? '개발자' : '비개발자'} {item.count}명
              </p>
            ))}
          </div>
          <div className="panel">
            <h3>사진 검수 대기</h3>
            {!data.photos.length && <p className="muted">대기 중인 사진이 없어요.</p>}
            {data.photos.map((person) => (
              <div className="mb-6 space-y-3" key={person.id}>
                <img
                  className="h-48 w-full rounded-lg object-cover"
                  src={person.photo}
                  alt={person.name + ' 검수 사진'}
                />
                <strong>{person.name}</strong>
                <p className="text-[10px] break-all text-fg-4">{person.id}</p>
                <input
                  aria-label={person.name + ' 사진 검수 사유'}
                  placeholder="반려 사유"
                  value={notes[person.id] ?? ''}
                  onChange={(e) => setNotes({ ...notes, [person.id]: e.target.value })}
                />
                <div className="flex gap-2">
                  <button
                    className="btn flex-1"
                    disabled={busy}
                    onClick={() =>
                      void act('/admin/photos/' + person.id, {
                        status: 'APPROVED',
                        reason: notes[person.id] ?? '',
                      })
                    }
                  >
                    승인
                  </button>
                  <button
                    className="btn secondary flex-1"
                    disabled={busy || !notes[person.id]?.trim()}
                    onClick={() =>
                      void act('/admin/photos/' + person.id, {
                        status: 'REJECTED',
                        reason: notes[person.id],
                      })
                    }
                  >
                    반려
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="panel">
            <h3>신고 검토</h3>
            {!data.reports.length && <p className="muted">대기 중인 신고가 없어요.</p>}
            {data.reports.map((report) => (
              <div className="mb-5 space-y-3" key={report.id}>
                <p>{report.reason}</p>
                <p className="text-[10px] break-all text-fg-4">대상 회원: {report.targetId}</p>
                <input
                  aria-label="신고 검토 메모"
                  placeholder="검토 메모"
                  value={notes[report.id] ?? ''}
                  onChange={(e) => setNotes({ ...notes, [report.id]: e.target.value })}
                />
                <div className="flex gap-2">
                  {(['VALID', 'DISMISSED'] as const).map((status) => (
                    <button
                      key={status}
                      disabled={busy}
                      className="btn secondary flex-1"
                      onClick={() =>
                        void act('/admin/reports/' + report.id, {
                          status,
                          note: notes[report.id] ?? '',
                        })
                      }
                    >
                      {status === 'VALID' ? '유효 신고' : '기각'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            <button className="back" disabled={page === 0} onClick={() => setPage(page - 1)}>
              이전
            </button>
            <span>{page + 1}</span>
            <button
              className="back"
              disabled={data.photos.length < 50 && data.reports.length < 50}
              onClick={() => setPage(page + 1)}
            >
              다음
            </button>
          </div>
          <div className="panel">
            <h3>계정 이용 제한</h3>
            <input
              placeholder="대상 회원 ID"
              aria-label="대상 회원 ID"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <input
              className="mt-2"
              placeholder="처리 사유"
              aria-label="이용 제한 사유"
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
            />
            <div className="mt-3 flex gap-2">
              {[true, false].map((suspended) => (
                <button
                  key={String(suspended)}
                  className="btn secondary flex-1"
                  disabled={busy || !target || !suspensionReason.trim()}
                  onClick={() =>
                    void act('/admin/accounts/' + target, { suspended, reason: suspensionReason })
                  }
                >
                  {suspended ? '이용 제한' : '제한 해제'}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      <Link className="back" to="/me">
        ← 내 정보
      </Link>
    </>
  );
};
export default AdminPage;
