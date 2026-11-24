import { z } from "zod";

/**
 * Client-side validation mirrors the backend DTOs (UserDto, LoginDto,
 * ForgotPasswordDto). The backend still validates every request; these
 * schemas only give the user faster, inline feedback.
 */

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 20;
const NAME_MAX = 100;
const EMAIL_MAX = 255;

const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(EMAIL_MAX, `Email must be at most ${EMAIL_MAX} characters`)
  .pipe(z.email("Enter a valid email address"));

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "First name is required")
      .max(NAME_MAX, `First name must be at most ${NAME_MAX} characters`),
    lastName: z
      .string()
      .trim()
      .max(NAME_MAX, `Last name must be at most ${NAME_MAX} characters`),
    email: emailField,
    password: z
      .string()
      .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
      .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters`),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
