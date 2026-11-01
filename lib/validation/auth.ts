import { z } from "zod";

// Shared by the server routes and the /login form, so it must stay free of
// server-only imports.

export const PASSWORD_MIN_LENGTH = 8;

const email = z.string().trim().toLowerCase().email("Correo inválido").max(254);

export const registerInputSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre").max(80),
  email,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`)
    .max(128),
});

export const loginInputSchema = z.object({
  email,
  password: z.string().min(1, "Escribe tu contraseña").max(128),
});

export const verifyInputSchema = z.object({
  email,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "El código tiene 6 dígitos"),
});

export const resendInputSchema = z.object({ email });

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type VerifyInput = z.infer<typeof verifyInputSchema>;
