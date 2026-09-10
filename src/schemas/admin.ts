import { z } from 'zod';

export const adminLoginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export const adminActionSchema = z.object({
  listingId: z.number().int().positive(),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z
    .string()
    .max(500, 'Rejection reason cannot exceed 500 characters')
    .optional(),
});

export type AdminActionPayload = z.infer<typeof adminActionSchema>;
