import { z } from 'zod';
import { parseForm } from './forms';
import {
  adminLoginSchema,
  loginSchema,
  recoveryEmailSchema,
  registrationSchema,
  resetPasswordSchema,
  verificationTokenSchema,
} from './auth';
import {
  companyDomainActivationSchema,
  companyDomainRegistrationSchema,
  companyEmailDecisionSchema,
  companyEmailReviewSchema,
  workEmailCodeSchema,
  workEmailRequestSchema,
} from './companyEmail';
import {
  photoReviewSchema,
  questionActivationSchema,
  questionDraftSchema,
  reportReviewSchema,
  suspensionSchema,
} from './admin';
import { matchingActivationSchema, matchingPresetSchema } from './matching';
import { profileSchema, valueAnswersSchema } from './profile';
import { messageSchema, reportSchema, targetSchema } from './community';

const routes: { method: string; path: RegExp; schema: z.ZodType }[] = [
  { method: 'POST', path: /^\/login$/, schema: loginSchema },
  { method: 'POST', path: /^\/register$/, schema: registrationSchema },
  { method: 'PUT', path: /^\/profile$/, schema: profileSchema },
  {
    method: 'PUT',
    path: /^\/profile\/values$/,
    schema: z.object({ valueAnswers: valueAnswersSchema }),
  },
  { method: 'POST', path: /^\/work-email\/request$/, schema: workEmailRequestSchema },
  { method: 'POST', path: /^\/work-email\/verify$/, schema: workEmailCodeSchema },
  { method: 'POST', path: /^\/work-email\/company-review$/, schema: companyEmailReviewSchema },
  { method: 'POST', path: /^\/auth\/password\/request$/, schema: recoveryEmailSchema },
  { method: 'POST', path: /^\/auth\/password\/reset$/, schema: resetPasswordSchema },
  { method: 'POST', path: /^\/auth\/email\/verify$/, schema: verificationTokenSchema },
  { method: 'POST', path: /^\/messages\/[^/]+$/, schema: messageSchema },
  { method: 'POST', path: /^\/report$/, schema: reportSchema },
  { method: 'POST', path: /^\/(?:likes|block)$/, schema: targetSchema },
  { method: 'POST', path: /^\/admin\/auth\/login$/, schema: adminLoginSchema },
  { method: 'PUT', path: /^\/admin\/photos\/[^/]+$/, schema: photoReviewSchema },
  { method: 'PUT', path: /^\/admin\/reports\/[^/]+$/, schema: reportReviewSchema },
  { method: 'PUT', path: /^\/admin\/accounts\/[^/]+$/, schema: suspensionSchema },
  { method: 'POST', path: /^\/admin\/questions$/, schema: questionDraftSchema },
  { method: 'PUT', path: /^\/admin\/questions\/[^/]+$/, schema: questionActivationSchema },
  { method: 'POST', path: /^\/admin\/matching$/, schema: matchingPresetSchema },
  { method: 'PUT', path: /^\/admin\/matching\/active$/, schema: matchingActivationSchema },
  {
    method: 'POST',
    path: /^\/admin\/company-email\/domains$/,
    schema: companyDomainRegistrationSchema,
  },
  {
    method: 'PUT',
    path: /^\/admin\/company-email\/domains\/[^/]+$/,
    schema: companyDomainActivationSchema,
  },
  {
    method: 'PUT',
    path: /^\/admin\/company-email\/requests\/[^/]+$/,
    schema: companyEmailDecisionSchema,
  },
];
export function validateRequestBody(path: string, method: string, body: unknown) {
  const route = routes.find(
    (route) => route.method === method && route.path.test(path.split('?')[0]),
  );
  return route ? parseForm(route.schema, body) : body;
}
