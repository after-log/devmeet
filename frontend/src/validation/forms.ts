import type { z } from 'zod';

type ValidationIssue = { path: PropertyKey[]; message: string };
export class FormValidationError extends Error {
  readonly status = 400;
  readonly fields: Record<string, string>;
  constructor(readonly issues: ValidationIssue[]) {
    super(issues[0]?.message ?? '입력값을 확인해 주세요.');
    this.name = 'FormValidationError';
    this.fields = {};
    for (const issue of issues) {
      const path = issue.path.map(String).join('.') || 'form';
      this.fields[path] ??= issue.message;
    }
  }
}
export function parseForm<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) throw new FormValidationError(result.error.issues);
  return result.data;
}

export function formErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '요청을 처리하지 못했어요.';
}
