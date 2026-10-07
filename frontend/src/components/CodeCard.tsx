import type { ReactNode } from 'react';
import type { SignupProfile } from '../types';
import { questions } from '../data/questions';
export const valueTags = (profile: SignupProfile) => {
  return profile.ans.flatMap((answer, i) =>
    answer === null || !questions[i] ? [] : [answer ? questions[i].o : questions[i].x],
  );
};
export const CodeCard = ({
  filename,
  lines,
  children,
  preview = false,
}: {
  filename: string;
  lines: ReactNode[];
  children?: ReactNode;
  preview?: boolean;
}) => {
  return (
    <div className={preview ? 'prev' : 'profile'}>
      <div className="file-tab">
        <span className="file-icon">ts</span>
        {filename}
        <span className="tab-end">{preview ? '•' : '✓'}</span>
      </div>
      <div className="code-block">
        {lines.map((line, i) => (
          <div className="code-line" key={i}>
            <i>{String(i + 1).padStart(2, '0')}</i>
            <code>{line}</code>
          </div>
        ))}
      </div>
      {children}
    </div>
  );
};
export const ProfilePreview = ({
  profile,
  complete = false,
}: {
  profile: SignupProfile;
  complete?: boolean;
}) => {
  const tags = valueTags(profile);
  const entries: [string, string][] = [];
  if (profile.role)
    entries.push(['role', JSON.stringify(profile.role === 'dev' ? 'developer' : 'open')]);
  if (profile.nick) entries.push(['name', JSON.stringify(profile.nick)]);
  const verified = [
    profile.email === 'ok' ? 'email' : '',
    profile.github === 'ok' ? 'github' : '',
  ].filter(Boolean);
  if (verified.length) entries.push(['verified', JSON.stringify(verified)]);
  if (tags.length || complete) entries.push(['values', String(tags.length)]);
  if (profile.pref)
    entries.push([
      'lookingFor',
      JSON.stringify(
        profile.pref === 'dev'
          ? 'developer'
          : profile.pref === 'other'
            ? 'non-developer'
            : 'anyone',
      ),
    ]);
  if (!entries.length) return null;
  return (
    <CodeCard
      filename="me.profile.ts"
      preview={!complete}
      lines={entries.map(([key, value]) => (
        <>
          {'\u00a0 '}
          {key}: <span className="string">{value}</span>,
        </>
      ))}
    >
      {complete && (
        <div className="profile-body">
          <p className="section-comment">// our pace</p>
          <div className="chips">
            {profile.details?.meeting && <span>{profile.details.meeting}</span>}
            {profile.details?.contact && <span>{profile.details.contact}</span>}
            {tags.length ? tags.map((tag) => <span key={tag}>{tag}</span>) : null}
          </div>
          <div className="verified mt-5">
            <span>✓</span>
            {profile.github === 'ok'
              ? profile.email === 'ok'
                ? '회사 이메일 · GitHub 인증 완료'
                : 'GitHub 인증 완료'
              : profile.email === 'ok'
                ? '회사 이메일 인증 완료'
                : '아직 인증한 항목이 없어요'}
          </div>
        </div>
      )}
    </CodeCard>
  );
};
