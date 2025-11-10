import { z } from 'zod';

// Schema para items de una orden
export const OrderItemSchema = z.object({
  productId: z.string().cuid('ID de producto inválido'),
  quantity: z.number()
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad mínima es 1')
    .max(50, 'La cantidad máxima es 50 por producto'),
  notes: z.string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional()
    .nullable()
    .transform(val => val ? val.trim() : null)
}).passthrough(); // Permitir campos adicionales como price si vienen del cliente

// Schema para crear una orden
export const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema)
    .min(1, 'Debe incluir al menos un producto')
    .max(20, 'Máximo 20 productos por orden'),
  tableId: z.string()
    .cuid('ID de mesa inválido')
    .optional(),
  sessionId: z.string()
    .cuid('ID de sesión inválido')
    .optional(),
  sessionCode: z.string()
    .optional(), // Código de sesión para buscar la sesión activa
  type: z.enum(['COMER_AQUI', 'PARA_LLEVAR'], {
    message: 'Tipo de orden inválido'
  }),
  customerName: z.string()
    .min(2, 'Nombre muy corto')
    .max(100, 'Nombre muy largo')
    .optional()
    .nullable()
    .transform(val => val ? val.trim() : null),
  customerEmail: z.string()
    .email('Email inválido')
    .max(255, 'Email muy largo')
    .optional()
    .nullable()
    .transform(val => val ? val.trim().toLowerCase() : null),
  notes: z.string()
    .max(1000, 'Las notas no pueden exceder 1000 caracteres')
    .optional()
    .nullable()
    .transform(val => val ? val.trim() : null),
  tip: z.number()
    .min(0, 'La propina no puede ser negativa')
    .max(1000000, 'Propina inválida')
    .optional()
    .default(0),
  discount: z.number()
    .min(0, 'El descuento no puede ser negativo')
    .max(100, 'El descuento no puede exceder 100%')
    .optional()
    .default(0)
}).refine(
  data => data.tableId || data.sessionCode || data.sessionId || data.type === 'PARA_LLEVAR',
  {
    message: 'Para órdenes de COMER_AQUI se requiere tableId, sessionCode o sessionId',
    path: ['tableId']
  }
);

// Schema para actualizar estado de orden
export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDIENTE',
    'ACEPTADA',
    'PREPARANDO',
    'LISTA',
    'ENTREGADA',
    'COMPLETADA',
    'PAGADA',
    'CANCELADA'
  ], {
    message: 'Estado de orden inválido'
  })
});

// Schema para filtros de órdenes
export const OrderFiltersSchema = z.object({
  status: z.enum([
    'PENDIENTE',
    'ACEPTADA',
    'PREPARANDO',
    'LISTA',
    'ENTREGADA',
    'COMPLETADA',
    'PAGADA',
    'CANCELADA'
  ]).optional(),
  tableId: z.string().cuid().optional(),
  sessionId: z.string().cuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

// Tipos TypeScript derivados de los schemas
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type OrderFiltersInput = z.infer<typeof OrderFiltersSchema>;
