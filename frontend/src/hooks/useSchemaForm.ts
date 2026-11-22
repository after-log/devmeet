import { useForm, type FieldValues, type UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

/** Keep resolver, validation timing and transformed submit values consistent across forms. */
export function useSchemaForm<Input extends FieldValues, Output extends FieldValues>(
  schema: z.ZodType<Output, Input>,
  options: Omit<UseFormProps<Input, unknown, Output>, 'resolver'> = {},
) {
  return useForm<Input, unknown, Output>({
    mode: 'onChange',
    ...options,
    resolver: zodResolver(schema),
  });
}
