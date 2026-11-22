import { z } from 'zod';
import { requiredText, uuidSchema } from './common';

export const messageTextSchema = requiredText('메시지', 1000);
export const messageSchema = z.object({ text: messageTextSchema });
export const reportSchema = z.object({ id: uuidSchema, reason: requiredText('신고 사유', 500) });
export const targetSchema = z.object({ id: uuidSchema });
