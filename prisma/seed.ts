import { PrismaClient, Role, OrderStatus, OrderType } from '@prisma/client';
import bcrypt from 'bcrypt';
import QRCode from 'qrcode';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateQRCode(restaurantSlug: string, tableNumber: number): string {
  const randomHash = crypto.randomBytes(4).toString('hex');
  return `${restaurantSlug}-mesa-${tableNumber}-${randomHash}`;
}

async function main() {
  console.log(' Iniciando seed multi-tenant...\n');

  // Limpiar datos
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.tableSession.deleteMany();
  await prisma.table.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.user.deleteMany();
  await prisma.restaurant.deleteMany();
  console.log(' Base de datos limpia\n');

  // Restaurante
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'Co.Mos',
      slug: 'comos',
      address: 'Calle 123 #45-67, Bogotá',
      phone: '+57 300 123 4567',
      email: 'contacto@comos.com',
      taxRate: 0.19,
      currency: 'COP',
    },
  });
  console.log(` Restaurante: ${restaurant.name}\n`);

  // Usuarios
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const admin = await prisma.user.create({
    data: {
      name: 'Felipe Raider',
      email: 'admin@comos.com',
      document: '1234567890',
      passwordHash: hashedPassword,
      role: Role.ADMIN,
      restaurantId: restaurant.id,
    },
  });

  const cocinero = await prisma.user.create({
    data: {
      name: 'Carlos Martínez',
      email: 'carlos@comos.com',
      document: '0987654321',
      passwordHash: hashedPassword,
      role: Role.COCINERO,
      restaurantId: restaurant.id,
    },
  });

  const mesero = await prisma.user.create({
    data: {
      name: 'María González',
      email: 'maria@comos.com',
      document: '1122334455',
      passwordHash: hashedPassword,
      role: Role.MESERO,
      restaurantId: restaurant.id,
    },
  });
  console.log(' 3 usuarios creados\n');

  // Mesas con QR
  const tables = [];
  for (let i = 1; i <= 15; i++) {
    const qrCode = generateQRCode(restaurant.slug, i);
    const qrDataUrl = await QRCode.toDataURL(
      `http://localhost:3000/scan/${qrCode}`,
      { width: 512, margin: 2 }
    );

    const table = await prisma.table.create({
      data: {
        number: i,
        capacity: i <= 5 ? 2 : i <= 10 ? 4 : 6,
        available: true,
        qrCode,
        qrImageUrl: qrDataUrl,
        restaurantId: restaurant.id,
      },
    });
    tables.push(table);
  }
  console.log(' 15 mesas con QR\n');

  // Categorías
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: 'Combos & Promociones', order: 1, restaurantId: restaurant.id },
    }),
    prisma.category.create({
      data: { name: 'Platos Fuertes', order: 2, restaurantId: restaurant.id },
    }),
    prisma.category.create({
      data: { name: 'Entradas & Snacks', order: 3, restaurantId: restaurant.id },
    }),
    prisma.category.create({
      data: { name: 'Bebidas', order: 4, restaurantId: restaurant.id },
    }),
    prisma.category.create({
      data: { name: 'Postres', order: 5, restaurantId: restaurant.id },
    }),
  ]);
  console.log(' 5 categorías\n');

  // Productos (simplificado)
  const products = [];
  
  products.push(await prisma.product.create({
    data: {
      name: 'Combo Familiar',
      description: '4 Hamburguesas + 4 Papas + 4 Bebidas',
      price: 89000,
      categoryId: categories[0].id,
      restaurantId: restaurant.id,
    },
  }));

  products.push(await prisma.product.create({
    data: {
      name: 'Hamburguesa Doble',
      description: 'Doble carne con queso cheddar',
      price: 24000,
      categoryId: categories[1].id,
      restaurantId: restaurant.id,
    },
  }));

  products.push(await prisma.product.create({
    data: {
      name: 'Papas Fritas',
      description: 'Porción grande',
      price: 8000,
      categoryId: categories[2].id,
      restaurantId: restaurant.id,
    },
  }));

  products.push(await prisma.product.create({
    data: {
      name: 'Coca Cola',
      description: 'Botella 400ml',
      price: 4500,
      categoryId: categories[3].id,
      restaurantId: restaurant.id,
    },
  }));

  products.push(await prisma.product.create({
    data: {
      name: 'Brownie con Helado',
      description: 'Brownie caliente con helado',
      price: 10000,
      categoryId: categories[4].id,
      restaurantId: restaurant.id,
    },
  }));

  console.log(' 5 productos demo\n');

  // Inventario
  await prisma.inventoryItem.createMany({
    data: [
      { name: 'Carne de Res', sku: 'CARNE-001', quantity: 50, unit: 'kg', minStock: 10, cost: 18000, restaurantId: restaurant.id },
      { name: 'Pan Hamburguesa', sku: 'PAN-001', quantity: 200, unit: 'unidad', minStock: 50, cost: 800, restaurantId: restaurant.id },
      { name: 'Papas Congeladas', sku: 'PAPA-001', quantity: 80, unit: 'kg', minStock: 20, cost: 3500, restaurantId: restaurant.id },
    ],
  });
  console.log(' 3 items de inventario\n');

  // Sesión y orden de ejemplo
  const session1 = await prisma.tableSession.create({
    data: {
      tableId: tables[2].id,
      sessionCode: 'ABC123',
      customerName: 'Juan Pérez',
      active: true,
    },
  });

  await prisma.order.create({
    data: {
      orderNumber: 'ORD-001',
      type: OrderType.COMER_AQUI,
      status: OrderStatus.PENDIENTE,
      restaurantId: restaurant.id,
      tableId: tables[2].id,
      sessionId: session1.id,
      customerName: 'Juan Pérez',
      subtotal: 28500,
      tax: 5415,
      total: 33915,
      items: {
        create: [
          { productId: products[1].id, quantity: 1, price: 24000 },
          { productId: products[3].id, quantity: 1, price: 4500 },
        ],
      },
    },
  });

  console.log(' 1 sesión y 1 orden de ejemplo\n');
  console.log('');
  console.log(`\n SEED COMPLETADO\n`);
  console.log(` Restaurante: ${restaurant.name}`);
  console.log(`   Slug: /${restaurant.slug}\n`);
  console.log(` CREDENCIALES (password: 123456):`);
  console.log(`    ${admin.email} - ADMIN`);
  console.log(`    ${cocinero.email} - COCINERO`);
  console.log(`     ${mesero.email} - MESERO\n`);
  console.log(` Datos creados:`);
  console.log(`   - 15 mesas con QR`);
  console.log(`   - 5 categorías`);
  console.log(`   - 5 productos`);
  console.log(`   - 3 items inventario`);
  console.log(`   - 1 orden activa\n`);
  console.log(` URL de prueba QR:`);
  console.log(`   http://localhost:3000/scan/${tables[0].qrCode}\n`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(' Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
