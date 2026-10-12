import { z } from "zod";

export const newsInputSchema = z.object({
  title: z.string().trim().min(3, "El título es muy corto").max(140, "Máximo 140 caracteres"),
  summary: z.string().trim().min(10, "El resumen es muy corto").max(280, "Máximo 280 caracteres"),
  body: z.string().trim().min(10, "El cuerpo es muy corto").max(10_000, "Máximo 10.000 caracteres"),
  topicId: z.string().uuid("Tema inválido"),
  /** "Enviar notificación push" checkbox. */
  notify: z.boolean().default(false),
});

export type NewsInput = z.infer<typeof newsInputSchema>;

export const preferencesInputSchema = z.object({
  topicIds: z.array(z.string().uuid()).max(50),
});

export type PreferencesInput = z.infer<typeof preferencesInputSchema>;
