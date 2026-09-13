import { z } from 'zod';

export const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
export const gocNumberRegex = /^(01-\d{5}|\d{5,6})$/;

export const listingFormSchema = z.object({
  practiceName: z
    .string()
    .min(2, 'Practice name must be at least 2 characters')
    .max(100, 'Practice name cannot exceed 100 characters'),
  contactName: z
    .string()
    .min(2, 'Contact name must be at least 2 characters')
    .max(100, 'Contact name cannot exceed 100 characters'),
  gocNumber: z
    .string()
    .trim()
    .regex(gocNumberRegex, 'Must be a valid UK GOC optometrist number (e.g. 01-12345 or 12345)'),
  addressLine1: z
    .string()
    .min(2, 'Address line 1 is required')
    .max(150, 'Address line 1 cannot exceed 150 characters'),
  addressLine2: z
    .string()
    .max(150, 'Address line 2 cannot exceed 150 characters')
    .optional()
    .or(z.literal('')),
  city: z
    .string()
    .min(2, 'City/Town is required')
    .max(100, 'City/Town cannot exceed 100 characters'),
  postcode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(ukPostcodeRegex, 'Must be a valid UK postcode'),
  latitude: z
    .number()
    .min(-90)
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number()
    .min(-180)
    .max(180, 'Longitude must be between -180 and 180'),
  phone: z
    .string()
    .min(5, 'Phone number is required')
    .max(30, 'Phone number is too long'),
  email: z
    .string()
    .email('Must be a valid email address'),
  website: z
    .string()
    .url('Must be a valid URL (including https://)')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .max(600, 'Description cannot exceed 600 characters')
    .optional()
    .or(z.literal('')),
  specialityIds: z
    .array(z.number())
    .min(1, 'Please select at least one speciality'),
  specialityOfferedBy: z
    .record(z.string(), z.enum(['personal', 'practice']).nullable().optional())
    .optional(),
  specialityReferralType: z
    .record(z.string(), z.enum(['referral_required', 'self_referral']).nullable().optional())
    .optional(),
  workingDays: z.array(z.string()).optional(),
  subscribeUpdates: z.boolean().default(true).optional(),
});

export type ListingFormValues = z.infer<typeof listingFormSchema>;
