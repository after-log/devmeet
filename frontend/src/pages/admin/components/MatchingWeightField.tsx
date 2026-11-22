import { useId, type Ref } from 'react';

export default function MatchingWeightField({
  label,
  detail,
  value,
  onChange,
  onBlur,
  inputRef,
}: {
  label: string;
  detail: string;
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const id = useId();
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <div className="flex items-center gap-1 text-sm">
          <input
            id={id}
            ref={inputRef}
            onBlur={onBlur}
            type="number"
            min={0}
            max={100}
            step={1}
            required
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="w-20 rounded-md border border-neutral-200 bg-white p-2 text-right text-sm text-neutral-800"
          />
          <span>%</span>
        </div>
      </div>
      <input
        type="range"
        aria-label={`${label} 가중치`}
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 h-2 min-h-0 w-full cursor-pointer border-0 bg-transparent p-0 accent-indigo-600"
      />
      <p className="mt-2! text-xs text-neutral-500">{detail}</p>
    </div>
  );
}
