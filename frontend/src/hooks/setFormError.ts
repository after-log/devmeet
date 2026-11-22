import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';
import { FormValidationError, formErrorMessage } from '@/validation/forms';

export function setFormError<T extends FieldValues>(setError: UseFormSetError<T>, error: unknown) {
  if (error instanceof FormValidationError) {
    for (const [name, message] of Object.entries(error.fields))
      setError((name === 'form' ? 'root.server' : name) as FieldPath<T>, {
        type: 'validation',
        message,
      });
  } else setError('root.server', { type: 'server', message: formErrorMessage(error) });
}
