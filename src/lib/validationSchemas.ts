/**
 * Centralized validation schemas using Zod
 * Reusable across Auth, forms, and API handlers
 */

import { z } from 'zod';

// ===== Auth Schemas =====
export const emailSchema = z
  .string()
  .trim()
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be less than 72 characters');

export const strongPasswordSchema = passwordSchema
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

export const fullNameSchema = z
  .string()
  .trim()
  .max(100, 'Name must be less than 100 characters')
  .optional();

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
  confirmPassword: z.string(),
  fullName: fullNameSchema,
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// ===== Contact / Form Schemas =====
export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  email: emailSchema,
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(1000, 'Message must be less than 1000 characters'),
  subject: z
    .string()
    .trim()
    .max(200, 'Subject must be less than 200 characters')
    .optional(),
});

// ===== Payment Schemas =====
export const paymentAmountSchema = z
  .number()
  .positive('Amount must be positive')
  .max(10000000, 'Amount exceeds maximum allowed');

export const promoCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(3, 'Promo code must be at least 3 characters')
  .max(20, 'Promo code must be less than 20 characters')
  .regex(/^[A-Z0-9]+$/, 'Promo code can only contain letters and numbers');

// ===== Entity Schemas =====
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'URL must be at least 3 characters')
  .max(50, 'URL must be less than 50 characters')
  .regex(/^[a-z0-9-]+$/, 'URL can only contain lowercase letters, numbers, and hyphens')
  .refine((val) => !val.startsWith('-') && !val.endsWith('-'), {
    message: 'URL cannot start or end with a hyphen',
  });

export const titleSchema = z
  .string()
  .trim()
  .min(3, 'Title must be at least 3 characters')
  .max(200, 'Title must be less than 200 characters');

export const descriptionSchema = z
  .string()
  .trim()
  .max(5000, 'Description must be less than 5000 characters')
  .optional();

// ===== Guest Schemas =====
export const guestInfoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, 'Please enter a valid phone number')
    .optional(),
});

// ===== Helper Type Exports =====
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type GuestInfo = z.infer<typeof guestInfoSchema>;

// ===== Validation Helper =====
export const validateField = <T>(
  schema: z.ZodType<T>,
  value: unknown
): { success: true; data: T } | { success: false; error: string } => {
  const result = schema.safeParse(value);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0]?.message || 'Validation failed' };
};
