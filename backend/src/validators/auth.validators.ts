import { z } from 'zod';
import { PASSWORD_MIN_LENGTH, USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from '../constants/auth';

export const signupSchema = z.object({
  username: z
    .string({ required_error: 'Username is required' })
    .trim()
    .min(USERNAME_MIN_LENGTH, `Username must be at least ${USERNAME_MIN_LENGTH} characters`)
    .max(USERNAME_MAX_LENGTH, `Username must not exceed ${USERNAME_MAX_LENGTH} characters`),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
});

export const signinSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
