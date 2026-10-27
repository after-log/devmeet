import { cn } from '@/lib/utils';
import type { FilterTabsProps } from '@/types/ui';

export const FilterTabs = <Value extends string>({
  label,
  options,
  value,
  onValueChange,
}: FilterTabsProps<Value>) => (
  <div className="filter-row mb-0 border-b border-line" role="group" aria-label={label}>
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        className={cn('pill', value === option.value && 'active')}
        aria-pressed={value === option.value}
        onClick={() => onValueChange(option.value)}
      >
        {option.label}
        {option.count !== undefined && (
          <span
            className={cn(
              'ml-1 font-mono text-[11px]',
              option.countTone === 'accent' ? 'text-blue' : 'text-fg-4',
            )}
          >
            {option.count}
          </span>
        )}
      </button>
    ))}
  </div>
);
