import { z } from 'zod';

// Payment validation schema
export const paymentSchema = z.object({
  amount: z.number()
    .positive('Amount must be greater than 0')
    .max(100000000, 'Amount exceeds maximum allowed'),
  method: z.enum(['manual', 'online'], {
    errorMap: () => ({ message: 'Please select a valid payment method' })
  }),
  provider: z.string().nullable().optional(),
  currency: z.string().length(3, 'Currency must be a 3-letter code').default('UGX'),
});

// Property validation schema
export const propertySchema = z.object({
  title: z.string()
    .min(1, 'Property title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .optional(),
  city: z.string()
    .max(100, 'City must be less than 100 characters')
    .optional(),
  region: z.string()
    .max(100, 'Region must be less than 100 characters')
    .optional(),
  country: z.string()
    .max(100, 'Country must be less than 100 characters')
    .default('Uganda'),
  rent_amount: z.number()
    .positive('Rent amount must be greater than 0')
    .max(100000000, 'Rent amount exceeds maximum allowed'),
  rent_currency: z.string().length(3, 'Currency must be a 3-letter code').default('UGX'),
  rent_due_day: z.number()
    .int('Due day must be a whole number')
    .min(1, 'Due day must be at least 1')
    .max(31, 'Due day cannot exceed 31')
    .nullable()
    .optional(),
  is_active: z.boolean().default(true),
});

// Unit validation schema
export const unitSchema = z.object({
  label: z.string()
    .min(1, 'Unit label is required')
    .max(100, 'Label must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  rent_amount: z.number()
    .positive('Rent amount must be greater than 0')
    .max(100000000, 'Rent amount exceeds maximum allowed')
    .nullable()
    .optional(),
  is_available: z.boolean().default(true),
});

// Join property validation schema
export const joinPropertySchema = z.object({
  joinCode: z.string()
    .min(1, 'Join code is required')
    .max(50, 'Join code is too long')
    .regex(/^[A-Za-z0-9-]+$/, 'Join code contains invalid characters'),
  message: z.string()
    .max(1000, 'Message must be less than 1000 characters')
    .optional(),
  unitId: z.string().uuid('Invalid unit ID').nullable().optional(),
});

// Review validation schema
export const reviewSchema = z.object({
  rating: z.number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  comment: z.string()
    .max(2000, 'Comment must be less than 2000 characters')
    .nullable()
    .optional(),
});

// Result types for validation
type ValidationSuccess<T> = { success: true; data: T };
type ValidationError = { success: false; error: string };
type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

// Helper function to validate and return result
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.errors[0]?.message || 'Validation failed',
  };
}
