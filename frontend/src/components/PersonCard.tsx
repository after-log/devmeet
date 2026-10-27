import type { ReactNode } from 'react';
import type { Person } from '../types';

/** 사진이 없거나 불러오지 못하면 이니셜 박스로 대신한다. */
export const Avatar = ({
  person,
  size = 46,
}: {
  person: Pick<Person, 'name' | 'photo'>;
  size?: number;
}) =>
  person.photo ? (
    <img
      className="avatar-photo"
      style={{ width: size, height: size }}
      src={person.photo}
      alt={`${person.name} 프로필 사진`}
      onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
    />
  ) : (
    <span className="small-avatar" style={{ width: size, height: size }}>
      {person.name.slice(0, 1)}
    </span>
  );

/** 코드 카드: 파일 탭 + 줄 번호 + 문법 색. 사람의 정보를 가볍게 '객체'처럼 보여 준다. */
export const CodeLines = ({ lines }: { lines: ReactNode[] }) => (
  <div className="code-block" aria-hidden="true">
    {lines.map((line, i) => (
      <div className="code-line" key={i}>
        <i>{String(i + 1).padStart(2, '0')}</i>
        <code>{line}</code>
      </div>
    ))}
  </div>
);

const str = (value: string) => <span className="string">{JSON.stringify(value)}</span>;

export const personLines = (p: Person, varName = 'match') => [
  <>
    <span className="keyword">const</span> <span className="variable">{varName}</span>
    {' = {'}
  </>,
  <>
    {'  meeting: '}
    {str(p.meeting)},
  </>,
  <>
    {'  contact: '}
    {str(p.contact)},
  </>,
  <>
    {'  tags: ['}
    {p.tags.slice(0, 3).map((t, i) => (
      <span key={t}>
        {i ? ', ' : ''}
        {str(t)}
      </span>
    ))}
    {'],'}
  </>,
  <>{'};'}</>,
];

const PersonCard = ({
  person,
  reason,
  onOpen,
  demo,
}: {
  person: Person;
  reason: string;
  onOpen: () => void;
  demo: boolean;
}) => (
  <article className="profile">
    <div className="file-tab">
      <span className="file-icon">ts</span>
      {person.name}.profile.ts<span className="tab-end">{demo ? 'demo' : '×'}</span>
    </div>
    <button
      className="card-photo"
      onClick={onOpen}
      aria-label={`${person.name} 프로필 자세히 보기`}
    >
      <img src={person.photo} alt={`${person.name} 프로필 사진`} />
    </button>
    <div className="profile-heading">
      <div>
        <div className="profile-name">
          {person.name}
          <span>{person.age}</span>
        </div>
        <p>
          {person.job} <span>· {person.location}</span>
        </p>
      </div>
      <span className="tag">{person.role === 'developer' ? 'dev' : 'open'}</span>
    </div>
    <CodeLines lines={personLines(person)} />
    <div className="profile-body">
      <p className="section-comment">// about me</p>
      <p className="bio line-clamp-3">{person.intro}</p>
      <div className="reason">
        <div className="reason-top">
          <span>함께 맞는 점</span>
        </div>
        <p>{reason}</p>
      </div>
      <div className="verified">
        <span>·</span>
        {demo ? '가상 프로필' : '본인 입력 정보 · 인증 전'}
      </div>
    </div>
  </article>
);
export default PersonCard;

export const PersonRow = ({
  person,
  note,
  end,
  onClick,
}: {
  person: Person;
  note?: string;
  end?: ReactNode;
  onClick: () => void;
}) => (
  <button className="listrow" onClick={onClick}>
    <Avatar person={person} />
    <span className="min-w-0">
      <strong>
        {person.name}, {person.age}
      </strong>
      <small className="truncate">{note ?? `${person.job} · ${person.location}`}</small>
    </span>
    {end ?? <time>›</time>}
  </button>
);

export const Empty = ({
  mark,
  title,
  children,
  action,
}: {
  mark: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) => (
  <div className="empty">
    <div className="big">{mark}</div>
    <h3>{title}</h3>
    <p>{children}</p>
    {action}
  </div>
);
