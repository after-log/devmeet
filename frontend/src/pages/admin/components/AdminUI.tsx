import type { ButtonHTMLAttributes, ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const reviewLabels: Record<string, string> = {
  PENDING: '검수 대기',
  APPROVED: '합격',
  REJECTED: '불합격',
  OPEN: '미처리',
  VALID: '처리 완료',
  DISMISSED: '기각',
};

export function AdminSurface({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "font-[-apple-system,BlinkMacSystemFont,'Apple_SD_Gothic_Neo','Noto_Sans_KR',sans-serif] text-[13px] leading-relaxed tracking-[-0.25px] text-[#262626] [color-scheme:light] [&_a]:no-underline [&_a:focus-visible]:outline-[#525252] [&_button]:transition-colors motion-reduce:[&_button]:transition-none [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-40 [&_button:focus-visible]:outline-[#525252] [&_h1]:m-0 [&_h2]:m-0 [&_h3]:m-0 [&_input:focus-visible]:outline-neutral-600 [&_p]:m-0 [&_select:focus-visible]:outline-neutral-600 [&_textarea:focus-visible]:outline-neutral-600",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminButton({
  variant = 'default',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'primary' | 'danger' }) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-[41px] items-center justify-center gap-2 rounded-[7px] border px-[15px] py-2.5 text-xs font-medium whitespace-nowrap',
        variant === 'primary'
          ? 'border-[#262626] bg-[#262626] text-white hover:bg-[#404040]'
          : variant === 'danger'
            ? 'border-[#e5e5e5] bg-[#f5f5f5] text-[#737373] hover:bg-[#e5e5e5]'
            : 'border-[#e5e5e5] bg-white text-[#737373] hover:bg-[#f5f5f5]',
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        'inline-grid size-8 shrink-0 place-items-center rounded-md border-0 bg-transparent text-[#a3a3a3] hover:bg-[#f5f5f5]',
        className,
      )}
      {...props}
    />
  );
}

export function Badge({ status, children }: { status: string; children?: ReactNode }) {
  const tone =
    status === 'PENDING' || status === 'OPEN'
      ? 'bg-[#f5f5f5] text-[#a3a3a3]'
      : status === 'APPROVED' || status === 'VALID'
        ? 'bg-[#f5f5f5] text-[#737373]'
        : status === 'REJECTED'
          ? 'bg-[#f5f5f5] text-[#737373]'
          : status === 'DISMISSED'
            ? 'bg-[#f5f5f5] text-[#737373]'
            : 'bg-[#f5f5f5] text-[#525252]';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[5px] rounded-[5px] px-2 py-[3px] text-[10px] font-medium whitespace-nowrap',
        tone,
        status === 'MOCK' && 'text-[9px] tracking-[0.7px]',
      )}
    >
      {children ?? reviewLabels[status] ?? status}
    </span>
  );
}

export function OnlineDot() {
  return <span className="inline-block size-1.5 shrink-0 rounded-full bg-[#a3a3a3]" />;
}

export function AdminAvatar() {
  return (
    <span className="inline-grid size-[33px] shrink-0 place-items-center rounded-full bg-[#e5e5e5] text-xs font-semibold text-[#404040]">
      A
    </span>
  );
}

export function EmptyState() {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-[9px] text-[#a3a3a3]">
      <Search size={28} />
      <strong className="text-[13px] text-[#737373]">조건에 맞는 항목이 없어요</strong>
      <span className="text-[11px]">검색어나 필터를 변경해 보세요.</span>
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn('overflow-hidden rounded-[11px] border border-[#e5e5e5] bg-white', className)}
    >
      {children}
    </section>
  );
}

export function Modal({
  title,
  description,
  children,
  close,
}: {
  title: string;
  description: string;
  children: ReactNode;
  close: () => void;
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-60 bg-[#17171770] backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-61 max-h-[90dvh] w-[calc(100%-36px)] max-w-[720px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[15px] bg-white p-[27px] shadow-[0_24px_100px_#17171730] max-sm:max-h-[92dvh] max-sm:p-[21px]">
          <AdminSurface>
            <header className="mb-[22px] flex items-start justify-between gap-[15px] border-b border-[#f5f5f5] pb-5">
              <div>
                <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
                <Dialog.Description className="mt-[5px] text-[11px] text-[#a3a3a3]">
                  {description}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <IconButton aria-label="닫기">
                  <X size={20} />
                </IconButton>
              </Dialog.Close>
            </header>
            {children}
          </AdminSurface>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="mt-[17px] block text-[11px] font-medium text-[#737373]">
      {label}
      {hint && <span className="ml-1.5 text-[10px] font-normal text-[#a3a3a3]">{hint}</span>}
      {children}
    </label>
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      className="mt-[7px] block min-h-[90px] w-full resize-y rounded-lg border border-[#e5e5e5] bg-white px-3 py-2.5 text-xs font-normal text-[#262626] outline-offset-3 placeholder:text-[#a3a3a3]"
      {...props}
    />
  );
}

export function Guidance({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="my-[18px] rounded-lg border border-[#e5e5e5] bg-[#f5f5f5] p-[15px] text-[11px] text-[#737373]">
      <strong className="font-semibold text-[#737373]">{title}</strong>
      {children}
    </div>
  );
}

export function DetailList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="my-5 text-xs">
      {items.map(([label, value]) => (
        <div key={label} className="flex border-b border-[#f5f5f5] py-3">
          <dt className="w-[115px] shrink-0 text-[#a3a3a3]">{label}</dt>
          <dd className="m-0 text-[#525252]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ModalActions({ children }: { children: ReactNode }) {
  return <div className="mt-[23px] flex flex-wrap justify-end gap-[9px]">{children}</div>;
}
export function PageHeading({
  kicker,
  title,
  description,
  children,
}: {
  kicker: string;
  title: ReactNode;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-[29px] flex items-center justify-between gap-[15px] max-sm:mb-[23px] max-sm:items-start max-sm:gap-2">
      <div>
        <span className="text-[9px] font-semibold tracking-[1.7px] text-[#a3a3a3]">{kicker}</span>
        <h1 className="mt-[7px]! mb-2! text-[27px] leading-snug font-semibold tracking-[-1.1px] max-lg:text-[25px] max-sm:text-[23px]">
          {title}
        </h1>
        <p className="text-xs text-[#a3a3a3] max-lg:text-[11px] max-sm:max-w-60 max-sm:text-[10px] max-sm:leading-relaxed">
          {description}
        </p>
      </div>
      {children ?? (
        <span className="mb-[3px] self-end text-[10px] text-[#a3a3a3] max-xl:hidden">
          미리보기 기준 · 2026년 11월 12일
        </span>
      )}
    </div>
  );
}

export function Tabs({
  options,
  value,
  onChange,
  inset = false,
}: {
  options: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
  inset?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex gap-[25px] overflow-x-auto border-b border-[#e5e5e5] max-sm:gap-[18px]',
        inset ? 'px-6 max-sm:px-4' : 'mb-[22px]',
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'border-0 border-b-2 bg-transparent px-px pt-[13px] pb-[15px] text-xs whitespace-nowrap max-sm:text-[11px]',
            value === option.value
              ? 'border-b-[#262626] font-semibold text-[#262626]'
              : 'border-b-transparent text-[#a3a3a3]',
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <span
              className={cn(
                'ml-[7px] inline-block rounded-[5px] px-1.5 py-px text-[10px]',
                value === option.value
                  ? 'bg-[#e5e5e5] text-[#404040]'
                  : 'bg-[#f5f5f5] text-[#a3a3a3]',
              )}
            >
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Toolbar({
  search,
  onSearch,
  placeholder,
  children,
  inset = false,
}: {
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  children?: ReactNode;
  inset?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3.5 max-sm:gap-2',
        inset ? 'px-6 py-5 max-sm:p-4' : 'mb-[22px]',
      )}
    >
      <div className="relative w-[340px] max-w-full max-sm:w-full">
        <Search
          size={17}
          className="absolute top-[13px] left-[13px] text-[#a3a3a3] max-sm:left-2.5 max-sm:size-3.5"
        />
        <input
          className="min-h-[42px] w-full rounded-lg border border-[#e5e5e5] bg-white py-2.5 pr-3 pl-[39px] text-[11px] text-[#262626] placeholder:text-[#a3a3a3] max-sm:pl-[31px] max-sm:text-[10px]"
          aria-label="검색"
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      {children}
    </div>
  );
}

export function StatusTabs({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="group"
      aria-label="상태 필터"
      className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-[#f5f5f5] p-1"
    >
      {options.map((option) => (
        <button
          key={option.value}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-md border-0 px-3 py-1.5 text-[11px] whitespace-nowrap',
            value === option.value
              ? 'bg-white font-semibold text-[#262626] shadow-sm'
              : 'bg-transparent text-[#a3a3a3] hover:text-[#262626]',
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <span className="ml-1.5 text-[10px] opacity-70">{option.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function ResultCount({ total, allTotal = total }: { total: number; allTotal?: number }) {
  return (
    <p className="text-[11px] text-neutral-500" aria-live="polite" aria-atomic="true">
      총 <strong className="font-semibold text-neutral-800">{total.toLocaleString('ko-KR')}</strong>
      건
      {allTotal !== total && (
        <span className="ml-1.5 text-neutral-400">(전체 {allTotal.toLocaleString('ko-KR')}건)</span>
      )}
    </p>
  );
}

export function Pager({
  page,
  total,
  change,
}: {
  page: number;
  total: number;
  change: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / 8));
  return (
    <nav
      aria-label="페이지 이동"
      className="flex items-center justify-center py-5 text-[11px] text-neutral-500"
    >
      <div className="flex items-center gap-[5px]">
        <button
          className="grid size-[29px] place-items-center rounded-[5px] border border-transparent bg-transparent"
          aria-label="이전 페이지"
          disabled={!page}
          onClick={() => change(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: pages }, (_, i) => (
          <button
            key={i}
            aria-label={`${i + 1}페이지`}
            aria-current={page === i ? 'page' : undefined}
            className={cn(
              'grid size-[29px] place-items-center rounded-[5px] border',
              page === i
                ? 'border-neutral-800 bg-neutral-800 text-white'
                : 'border-transparent bg-transparent',
            )}
            onClick={() => change(i)}
          >
            {i + 1}
          </button>
        ))}
        <button
          className="grid size-[29px] place-items-center rounded-[5px] border border-transparent bg-transparent"
          aria-label="다음 페이지"
          disabled={page + 1 >= pages}
          onClick={() => change(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
