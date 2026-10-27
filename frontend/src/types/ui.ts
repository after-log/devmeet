export interface FilterTabOption<Value extends string> {
  value: Value;
  label: string;
  count?: number;
  countTone?: 'default' | 'accent';
}

export interface FilterTabsProps<Value extends string> {
  label: string;
  options: readonly FilterTabOption<Value>[];
  value: Value;
  onValueChange: (value: Value) => void;
}
