import type { ButtonHTMLAttributes, ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react';
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
        "font-[-apple-system,BlinkMacSystemFont,'Apple_SD_Gothic_Neo','Noto_Sans_KR',sans-serif] text-[13px] leading-relaxed tracking-[-0.25px] text-[#293040] [color-scheme:light] [&_a]:no-underline [&_a:focus-visible]:outline-[#7961d2] [&_button]:transition-colors motion-reduce:[&_button]:transition-none [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-40 [&_button:focus-visible]:outline-[#7961d2] [&_h1]:m-0 [&_h2]:m-0 [&_h3]:m-0 [&_p]:m-0",
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
          ? 'border-[#8664c7] bg-[#8664c7] text-white hover:bg-[#7554b6]'
          : variant === 'danger'
            ? 'border-[#f1d8d5] bg-[#fff4f3] text-[#c46d69] hover:bg-[#fce9e7]'
            : 'border-[#dfe1e9] bg-white text-[#6a7080] hover:bg-[#f2f0f7]',
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
        'inline-grid size-8 shrink-0 place-items-center rounded-md border-0 bg-transparent text-[#8b90a0] hover:bg-[#f0eef5]',
        className,
      )}
      {...props}
    />
  );
}

export function Badge({ status, children }: { status: string; children?: ReactNode }) {
  const tone =
    status === 'PENDING' || status === 'OPEN'
      ? 'bg-[#fff4df] text-[#bd8b36]'
      : status === 'APPROVED' || status === 'VALID'
        ? 'bg-[#eaf5ee] text-[#528c68]'
        : status === 'REJECTED'
          ? 'bg-[#fceeed] text-[#c47170]'
          : status === 'DISMISSED'
            ? 'bg-[#eef0f4] text-[#858b99]'
            : 'bg-[#f2eff9] text-[#8a6abf]';
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
  return <span className="inline-block size-1.5 shrink-0 rounded-full bg-[#66b28c]" />;
}

export function AdminAvatar() {
  return (
    <span className="inline-grid size-[33px] shrink-0 place-items-center rounded-full bg-[#eee9f8] text-xs font-semibold text-[#8463cb]">
      A
    </span>
  );
}

export function EmptyState() {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-[9px] text-[#aaa7b6]">
      <Search size={28} />
      <strong className="text-[13px] text-[#80798f]">조건에 맞는 항목이 없어요</strong>
      <span className="text-[11px]">검색어나 필터를 변경해 보세요.</span>
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn('overflow-hidden rounded-[11px] border border-[#e7e9f0] bg-white', className)}
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
        <Dialog.Overlay className="fixed inset-0 z-60 bg-[#17132670] backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-61 max-h-[90dvh] w-[calc(100%-36px)] max-w-[720px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[15px] bg-white p-[27px] shadow-[0_24px_100px_#18112d30] max-sm:max-h-[92dvh] max-sm:p-[21px]">
          <AdminSurface>
            <header className="mb-[22px] flex items-start justify-between gap-[15px] border-b border-[#eeedf3] pb-5">
              <div>
                <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
                <Dialog.Description className="mt-[5px] text-[11px] text-[#9691a0]">
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
    <label className="mt-[17px] block text-[11px] font-medium text-[#6f677b]">
      {label}
      {hint && <span className="ml-1.5 text-[10px] font-normal text-[#aaa3b5]">{hint}</span>}
      {children}
    </label>
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      className="mt-[7px] block min-h-[90px] w-full resize-y rounded-lg border border-[#dfe3eb] bg-white px-3 py-2.5 text-xs font-normal text-[#293040] outline-offset-3 placeholder:text-[#aaa3b4]"
      {...props}
    />
  );
}

export function Guidance({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="my-[18px] rounded-lg border border-[#ece7f3] bg-[#f8f6fb] p-[15px] text-[11px] text-[#90849e]">
      <strong className="font-semibold text-[#7f6e94]">{title}</strong>
      {children}
    </div>
  );
}

export function DetailList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="my-5 text-xs">
      {items.map(([label, value]) => (
        <div key={label} className="flex border-b border-[#f0edf4] py-3">
          <dt className="w-[115px] shrink-0 text-[#a29aa9]">{label}</dt>
          <dd className="m-0 text-[#62596f]">{value}</dd>
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
        <span className="text-[9px] font-semibold tracking-[1.7px] text-[#9a90ae]">{kicker}</span>
        <h1 className="mt-[7px]! mb-2! text-[27px] leading-snug font-semibold tracking-[-1.1px] max-lg:text-[25px] max-sm:text-[23px]">
          {title}
        </h1>
        <p className="text-xs text-[#9297a5] max-lg:text-[11px] max-sm:max-w-60 max-sm:text-[10px] max-sm:leading-relaxed">
          {description}
        </p>
      </div>
      {children ?? (
        <span className="mb-[3px] self-end text-[10px] text-[#9b9fab] max-xl:hidden">
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
        'flex gap-[25px] overflow-x-auto border-b border-[#e4e7ef] max-sm:gap-[18px]',
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
              ? 'border-b-[#8867c9] font-semibold text-[#8867c9]'
              : 'border-b-transparent text-[#9298a6]',
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <span
              className={cn(
                'ml-[7px] inline-block rounded-[5px] px-1.5 py-px text-[10px]',
                value === option.value
                  ? 'bg-[#ece5f7] text-[#8e6bc7]'
                  : 'bg-[#eceef3] text-[#9195a1]',
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
  filter,
  onFilter,
  placeholder,
  options,
  inset = false,
}: {
  search: string;
  onSearch: (value: string) => void;
  filter: string;
  onFilter: (value: string) => void;
  placeholder: string;
  options: [string, string][];
  inset?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3.5 max-sm:gap-2',
        inset ? 'px-6 py-5 max-sm:p-4' : 'mb-[22px]',
      )}
    >
      <div className="relative w-[340px] max-w-full max-sm:min-w-0 max-sm:flex-1">
        <Search
          size={17}
          className="absolute top-[13px] left-[13px] text-[#a2a6b3] max-sm:left-2.5 max-sm:size-3.5"
        />
        <input
          className="min-h-[42px] w-full rounded-lg border border-[#dfe3eb] bg-white py-2.5 pr-3 pl-[39px] text-[11px] text-[#293040] placeholder:text-[#9a9faf] max-sm:pl-[31px] max-sm:text-[10px]"
          aria-label="검색"
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div className="ml-auto flex items-center gap-[7px] rounded-[7px] border border-[#e1e4ec] bg-white pl-3 text-[#999fac] max-sm:gap-[5px] max-sm:pl-2">
        <SlidersHorizontal size={15} />
        <select
          aria-label="상태 필터"
          className="min-h-10 w-[115px] border-0 bg-white py-2 pr-3 pl-0 text-[11px] text-[#293040] max-sm:w-[85px] max-sm:text-[10px]"
          value={filter}
          onChange={(e) => onFilter(e.target.value)}
        >
          {options.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
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
    <footer className="flex items-center justify-between py-5 text-[10px] text-[#9da2ae]">
      <span>
        총 {total}개 중 {total ? page * 8 + 1 : 0}–{Math.min((page + 1) * 8, total)}개
      </span>
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
            className={cn(
              'grid size-[29px] place-items-center rounded-[5px] border',
              page === i
                ? 'border-[#e7def3] bg-[#eee8f8] text-[#8b65c7]'
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
    </footer>
  );
}

export function AdminTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[11px] whitespace-nowrap [&_small]:mt-1 [&_small]:block [&_small]:text-[9px] [&_small]:text-[#a0a5b1] [&_strong]:font-medium [&_strong]:text-[#464d5d] [&_tbody_tr:hover]:bg-[#fdfcfe] [&_td]:border-b [&_td]:border-[#f0f1f5] [&_td]:px-[23px] [&_td]:py-[19px] [&_td]:text-[#717887] max-xl:[&_td]:px-4 max-sm:[&_td]:py-3.5 [&_th]:border-y [&_th]:border-[#eff0f4] [&_th]:bg-[#fafbfc] [&_th]:px-[23px] [&_th]:py-[13px] [&_th]:text-[10px] [&_th]:font-medium [&_th]:text-[#9ba0ad] max-xl:[&_th]:px-4">
        {children}
      </table>
    </div>
  );
}
