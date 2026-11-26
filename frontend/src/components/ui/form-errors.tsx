import type { FieldErrors, FieldValues } from 'react-hook-form';

function firstMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return;
  if ('message' in error && typeof error.message === 'string') return error.message;
  for (const [key, value] of Object.entries(error)) {
    if (key === 'ref' || key === 'types') continue;
    const message = firstMessage(value);
    if (message) return message;
  }
}
export function FormErrors<T extends FieldValues>({
  errors,
  serverError,
  className = 'mt-3 text-sm text-danger',
}: {
  errors: FieldErrors<T>;
  serverError?: string;
  className?: string;
}) {
  const message = firstMessage(errors) || serverError;
  return message ? (
    <p role="alert" className={className}>
      {message}
    </p>
  ) : null;
}
