import { z } from 'zod';

// Schema para crear un producto
export const CreateProductSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .transform(val => val.trim()),
  description: z.string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional()
    .transform(val => val?.trim()),
  price: z.number()
    .positive('El precio debe ser positivo')
    .max(10000000, 'Precio inválido'),
  imageUrl: z.string()
    .url('URL de imagen inválida')
    .max(2048, 'URL muy larga')
    .optional(),
  available: z.boolean()
    .optional()
    .default(true),
  category: z.string()
    .max(50, 'Categoría muy larga')
    .optional()
    .default('PLATO_PRINCIPAL'),
  categoryId: z.string()
    .cuid('ID de categoría inválido')
    .optional()
});

// Schema para actualizar un producto
export const UpdateProductSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .transform(val => val.trim())
    .optional(),
  description: z.string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional()
    .transform(val => val?.trim()),
  price: z.number()
    .positive('El precio debe ser positivo')
    .max(10000000, 'Precio inválido')
    .optional(),
  imageUrl: z.string()
    .url('URL de imagen inválida')
    .max(2048, 'URL muy larga')
    .optional(),
  available: z.boolean().optional(),
  category: z.string()
    .max(50, 'Categoría muy larga')
    .optional(),
  categoryId: z.string()
    .cuid('ID de categoría inválido')
    .optional()
});

// Tipos TypeScript derivados
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
