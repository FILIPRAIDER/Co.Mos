import { z } from 'zod';

// Schema para actualizar sesión
export const UpdateSessionSchema = z.object({
  active: z.boolean({
    message: 'El estado activo debe ser booleano'
  }),
  customerName: z.string()
    .min(2, 'Nombre muy corto')
    .max(100, 'Nombre muy largo')
    .optional()
    .transform(val => val?.trim())
});

// Schema para crear sesión (interno)
export const CreateSessionSchema = z.object({
  tableId: z.string().cuid('ID de mesa inválido'),
  sessionCode: z.string().min(8, 'Código de sesión inválido'),
  customerName: z.string()
    .min(2, 'Nombre muy corto')
    .max(100, 'Nombre muy largo')
    .optional()
    .transform(val => val?.trim())
});

// Tipos TypeScript derivados
export type UpdateSessionInput = z.infer<typeof UpdateSessionSchema>;
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
