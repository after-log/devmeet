import { useState } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';

export type SelectOption = string | { value: string; label: string };

// Shared themed select: Radix manages focus, keyboard input, typeahead and portals.
export const Select = ({
  id,
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder = '선택해주세요',
  disabled = false,
  className,
}: {
  id: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) => {
  const [localValue, setLocalValue] = useState(defaultValue ?? '');
  return (
    <SelectPrimitive.Root
      value={value ?? localValue}
      onValueChange={(next) => {
        if (value === undefined) setLocalValue(next);
        onValueChange?.(next);
      }}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        id={id}
        className={cn(
          'flex min-h-12 w-full items-center justify-between gap-3 rounded-md border border-line-strong bg-surface px-[13px] py-3 text-left text-[14px] text-fg transition-colors outline-none hover:border-hover-line focus-visible:ring-2 focus-visible:ring-blue disabled:cursor-default disabled:opacity-50 data-[placeholder]:text-fg-4 data-[state=open]:border-blue',
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon className="text-fg-3">
          <ChevronDown className="size-4" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          collisionPadding={16}
          className="z-[100] max-h-[min(360px,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-line-strong bg-surface text-fg shadow-[0_12px_40px_#0006]"
        >
          <SelectPrimitive.ScrollUpButton className="flex h-7 items-center justify-center bg-lift text-fg-3">
            <ChevronUp className="size-4" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="p-1.5">
            {options.map((option) => {
              const item = typeof option === 'string' ? { value: option, label: option } : option;
              return (
                <SelectPrimitive.Item
                  key={item.value}
                  value={item.value}
                  className="relative flex min-h-12 cursor-pointer items-center rounded-md py-3 pr-10 pl-3 text-[13px] outline-none select-none data-[highlighted]:bg-mine data-[highlighted]:text-mine-fg data-[state=checked]:text-blue"
                >
                  <SelectPrimitive.ItemText>{item.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-3 text-blue">
                    <Check className="size-4" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              );
            })}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex h-7 items-center justify-center bg-lift text-fg-3">
            <ChevronDown className="size-4" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
};
