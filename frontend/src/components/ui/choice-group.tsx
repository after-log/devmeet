import { Check } from 'lucide-react';

export const ChoiceGroup = ({
  id,
  label,
  options,
  value,
  onValueChange,
}: {
  id: string;
  label: string;
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
}) => (
  <fieldset className="mt-[22px] border-0 p-0">
    <legend className="mb-[9px] p-0 text-[13px] text-fg-3">{label}</legend>
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => (
        <label key={option} className="relative cursor-pointer">
          <input
            className="peer sr-only"
            type="radio"
            name={id}
            value={option}
            checked={value === option}
            onChange={() => onValueChange(option)}
          />
          <span className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-3 py-3 text-center text-[13px] text-fg-3 transition-colors peer-checked:border-blue peer-checked:bg-mine peer-checked:text-mine-fg peer-focus-visible:ring-2 peer-focus-visible:ring-blue peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-canvas hover:border-hover-line">
            {value === option && <Check className="size-3.5 text-blue" />}
            {option}
          </span>
        </label>
      ))}
    </div>
  </fieldset>
);
