import { z } from 'zod';

// Schema para crear una mesa
export const CreateTableSchema = z.object({
  number: z.number()
    .int('El número de mesa debe ser un entero')
    .min(1, 'El número de mesa debe ser al menos 1')
    .max(999, 'El número de mesa no puede exceder 999'),
  capacity: z.number()
    .int('La capacidad debe ser un entero')
    .min(1, 'La capacidad mínima es 1 persona')
    .max(50, 'La capacidad máxima es 50 personas')
    .optional()
    .default(4)
});

// Schema para actualizar mesa
export const UpdateTableSchema = z.object({
  id: z.string().cuid('ID de mesa inválido'),
  available: z.boolean({
    message: 'El estado disponible debe ser booleano'
  }).optional(),
  capacity: z.number()
    .int('La capacidad debe ser un entero')
    .min(1, 'La capacidad mínima es 1 persona')
    .max(50, 'La capacidad máxima es 50 personas')
    .optional()
});

// Tipos TypeScript derivados
export type CreateTableInput = z.infer<typeof CreateTableSchema>;
export type UpdateTableInput = z.infer<typeof UpdateTableSchema>;
