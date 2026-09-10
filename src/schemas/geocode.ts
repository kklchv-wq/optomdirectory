import { z } from 'zod';
import { ukPostcodeRegex } from './listing';

export const postcodeSearchSchema = z.object({
  postcode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(ukPostcodeRegex, 'Invalid UK postcode format'),
});

export const geocodeAddressSchema = z.object({
  address: z.string().min(3, 'Address string must be at least 3 characters'),
});

export const spatialSearchQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(100).default(25),
  specialities: z
    .string()
    .transform((val) => val.split(',').filter(Boolean))
    .optional(),
  search: z.string().optional(),
});
