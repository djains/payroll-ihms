import { z } from 'zod';

/**
 * Normal Staff / Employee Login Validation Schema
 */
export const staffLoginSchema = z.object({
  companyCode: z
    .string()
    .trim()
    .min(1, 'Company code is required')
    .max(10, 'Company code cannot exceed 10 characters'),
  username: z
    .string()
    .trim()
    .min(1, 'Employee Code / User ID is required')
    .min(3, 'Employee Code must be at least 3 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(4, 'Password must be at least 4 characters'),
});

/**
 * Administrator Login Validation Schema (No Company Code required)
 */
export const adminLoginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'Admin ID is required')
    .min(3, 'Admin ID must be at least 3 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(4, 'Password must be at least 4 characters'),
});

/**
 * 3-Point Identity Verification & Reset Password Validation Schema
 */
export const forgotPasswordSchema = z
  .object({
    empCode: z
      .string()
      .trim()
      .min(1, 'Employee code is required')
      .min(3, 'Employee code must be at least 3 characters'),
    dob: z
      .string()
      .trim()
      .min(1, 'Date of Birth is required')
      .regex(
        /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
        'Date of Birth must be in DD/MM/YYYY format'
      ),
    aadhaar: z
      .string()
      .trim()
      .min(1, 'Aadhaar number is required')
      .regex(/^\d{12}$/, 'Aadhaar must be exactly 12 digits'),
    newPassword: z
      .string()
      .min(1, 'New password is required')
      .min(6, 'New password must be at least 6 characters long'),
    confirmPassword: z
      .string()
      .min(1, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type StaffLoginInput = z.infer<typeof staffLoginSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Super Admin - Add Company Step 1 Validation Schema
 */
export const companyStep1Schema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, 'Company name is required')
    .min(3, 'Company name must be at least 3 characters'),
  fileNo: z
    .string()
    .trim()
    .min(1, 'File number is required'),
  companyPan: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, 'Company PAN is required')
    .regex(
      /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      'Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F)'
    ),
  companyContact: z
    .string()
    .trim()
    .min(1, 'Official contact number is required')
    .regex(/^\d{10}$/, 'Official contact number must be exactly 10 digits'),
});

export type CompanyStep1Input = z.infer<typeof companyStep1Schema>;


