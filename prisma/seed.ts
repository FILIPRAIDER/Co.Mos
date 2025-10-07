import { PrismaClient, Role, OrderStatus, OrderType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Limpiar datos existentes
  console.log('🗑️  Limpiando datos existentes...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.user.deleteMany();

  // Crear usuarios
  console.log('👤 Creando usuarios...');
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const admin = await prisma.user.create({
    data: {
      name: 'Felipe Raider',
      email: 'admin@comos.com',
      document: '1234567890',
      passwordHash: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const worker = await prisma.user.create({
    data: {
      name: 'María González',
      email: 'maria@comos.com',
      document: '0987654321',
      passwordHash: hashedPassword,
      role: Role.WORKER,
    },
  });

  console.log('✅ Usuarios creados');

  // Crear mesas
  console.log('🪑 Creando mesas...');
  const tables = [];
  for (let i = 1; i <= 10; i++) {
    const table = await prisma.table.create({
      data: {
        number: i,
        capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
        available: i <= 6,
      },
    });
    tables.push(table);
  }
  console.log('✅ 10 mesas creadas');

  // Crear categorías
  console.log('📁 Creando categorías...');
  const cat1 = await prisma.category.create({
    data: {
      name: 'Combos & Promociones',
      description: 'Las mejores ofertas y combos del día',
      order: 1,
    },
  });
  
  const cat2 = await prisma.category.create({
    data: {
      name: 'Platos Fuertes',
      description: 'Platos principales para satisfacer tu hambre',
      order: 2,
    },
  });
  
  const cat3 = await prisma.category.create({
    data: {
      name: 'Entradas & Snacks',
      description: 'Deliciosas entradas para compartir',
      order: 3,
    },
  });
  
  const cat4 = await prisma.category.create({
    data: {
      name: 'Bebidas',
      description: 'Refrescantes bebidas para acompañar tu comida',
      order: 4,
    },
  });
  
  const cat5 = await prisma.category.create({
    data: {
      name: 'Postres y Dulces',
      description: 'Endulza tu día con nuestros postres',
      order: 5,
    },
  });
  
  const categories = [cat1, cat2, cat3, cat4, cat5];
  console.log('✅ 5 categorías creadas');

  // Crear productos secuencialmente para evitar límite de conexiones
  console.log('🍔 Creando productos...');
  const products = [];
  
  // Combos & Promociones
  products.push(await prisma.product.create({
    data: {
      name: 'Combo Familiar',
      description: '4 Hamburguesas + 4 Papas + 4 Bebidas',
      price: 89000,
      categoryId: categories[0].id,
      available: true,
    },
  }));
  
  products.push(await prisma.product.create({
    data: {
      name: 'Combo Pareja',
      description: '2 Hamburguesas + 2 Papas + 2 Bebidas',
      price: 45000,
      categoryId: categories[0].id,
      available: true,
    },
  }));

  // Platos Fuertes
  products.push(await prisma.product.create({
    data: {
      name: 'Hamburguesa 2ble Carne',
      description: 'Doble carne de res, queso cheddar, lechuga, tomate y salsa especial',
      price: 24000,
      categoryId: categories[1].id,
      available: true,
    },
  }));
  
  products.push(await prisma.product.create({
    data: {
      name: 'Hamburguesa Sencilla',
      description: 'Carne de res, queso, lechuga, tomate y salsas',
      price: 16000,
      categoryId: categories[1].id,
      available: true,
    },
  }));
  
  products.push(await prisma.product.create({
    data: {
      name: 'Perro Caliente V2',
      description: 'Salchicha premium con queso, papas, salsas y acompañamientos',
      price: 12000,
      categoryId: categories[1].id,
      available: true,
    },
  }));
  
  products.push(await prisma.product.create({
    data: {
      name: 'Patacón con Todo',
      description: 'Patacón grande con carne, pollo, chorizo, queso y salsas',
      price: 18000,
      categoryId: categories[1].id,
      available: true,
    },
  }));

  // Entradas & Snacks
  products.push(await prisma.product.create({
    data: {
      name: 'Salchipapas Clásica',
      description: 'Papas fritas con salchicha y salsas',
      price: 11000,
      categoryId: categories[2].id,
      available: true,
    },
  }));
  
  products.push(await prisma.product.create({
    data: {
      name: 'Papas Fritas',
      description: 'Porción grande de papas fritas crujientes',
      price: 8000,
      categoryId: categories[2].id,
      available: true,
    },
  }));
  
  products.push(await prisma.product.create({
    data: {
      name: 'Aros de Cebolla',
      description: 'Aros de cebolla empanizados y fritos',
      price: 9000,
      categoryId: categories[2].id,
      available: true,
    },
  }));
  
  products.push(await prisma.product.create({
    data: {
      name: 'Alitas de Pollo x6',
      description: 'Alitas picantes o BBQ con salsa ranch',
      price: 15000,
      categoryId: categories[2].id,
      available: true,
    },
  }));

  // Bebidas
  products.push(await prisma.product.create({
    data: {
      name: 'Coca Cola 300ml',
      description: 'Coca Cola original en lata',
      price: 3500,
      categoryId: categories[3].id,
      available: true,
    },
  }));
  
  products.push(await prisma.product.create({
    data: {
      name: 'Coca Cola 400ml',
      description: 'Coca Cola original en botella personal',
      price: 4500,
      categoryId: categories[3].id,
      available: true,
    },
  }));
  
  products.push(await prisma.product.create({
    data: {
      name: 'Jugo Natural',
      description: 'Jugo natural de frutas de temporada',
      price: 6000,
      categoryId: categories[3].id,
      available: true,
    },
  }));
  
  products.push(await prisma.product.create({
    data: {
      name: 'Limonada Natural',
      description: 'Limonada fresca hecha en casa',
      price: 5000,
      categoryId: categories[3].id,
      available: true,
    },
  }));
  
  products.push(await prisma.product.create({
    data: {
      name: 'Agua en Botella',
      description: 'Agua mineral 500ml',
      price: 2500,
      categoryId: categories[3].id,
      available: true,
    },
  }));

  // Postres
  products.push(await prisma.product.create({
    data: {
      name: 'Helado Sundae',
      description: 'Helado de vainilla con salsa de chocolate y cereza',
      price: 8000,
      categoryId: categories[4].id,
      available: true,
    },
  }));
  
  products.push(await prisma.product.create({
    data: {
      name: 'Brownie con Helado',
      description: 'Brownie de chocolate caliente con helado de vainilla',
      price: 10000,
      categoryId: categories[4].id,
      available: true,
    },
  }));
  
  products.push(await prisma.product.create({
    data: {
      name: 'Cheesecake',
      description: 'Porción de cheesecake con salsa de frutos rojos',
      price: 12000,
      categoryId: categories[4].id,
      available: true,
    },
  }));
  
  products.push(await prisma.product.create({
    data: {
      name: 'Flan de Caramelo',
      description: 'Flan casero con caramelo líquido',
      price: 7000,
      categoryId: categories[4].id,
      available: true,
    },
  }));
  
  products.push(await prisma.product.create({
    data: {
      name: 'Tiramisú',
      description: 'Postre italiano de café y mascarpone',
      price: 13000,
      categoryId: categories[4].id,
      available: true,
    },
  }));
  
  console.log('✅ 20 productos creados');

  // Crear órdenes de ejemplo
  console.log('📝 Creando órdenes de ejemplo...');
  
  // Orden 1 - En preparación en mesa 2
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-001',
      type: OrderType.DINE_IN,
      status: OrderStatus.PREPARING,
      tableId: tables[1].id,
      userId: worker.id,
      subtotal: 28500,
      tax: 5415,
      tip: 0,
      total: 33915,
      items: {
        create: [
          {
            productId: products[2].id, // Hamburguesa 2ble Carne
            quantity: 2,
            price: 24000,
          },
          {
            productId: products[11].id, // Coca Cola 400ml
            quantity: 1,
            price: 4500,
          },
        ],
      },
    },
  });

  // Orden 2 - Lista para entregar en mesa 5
  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-002',
      type: OrderType.DINE_IN,
      status: OrderStatus.READY,
      tableId: tables[4].id,
      userId: worker.id,
      subtotal: 28500,
      tax: 5415,
      tip: 2850,
      total: 36765,
      items: {
        create: [
          {
            productId: products[2].id,
            quantity: 2,
            price: 24000,
          },
          {
            productId: products[11].id,
            quantity: 1,
            price: 4500,
          },
        ],
      },
    },
  });

  // Orden 3 - Lista para entregar en mesa 6
  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-003',
      type: OrderType.DINE_IN,
      status: OrderStatus.READY,
      tableId: tables[5].id,
      userId: admin.id,
      subtotal: 28500,
      tax: 5415,
      tip: 0,
      total: 33915,
      items: {
        create: [
          {
            productId: products[2].id,
            quantity: 2,
            price: 24000,
          },
          {
            productId: products[11].id,
            quantity: 1,
            price: 4500,
          },
        ],
      },
    },
  });

  // Orden 4 - Requiere atención en mesa 9
  const order4 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-004',
      type: OrderType.DINE_IN,
      status: OrderStatus.DELIVERED,
      tableId: tables[8].id,
      customerName: 'Carlos Pérez',
      customerEmail: 'carlos@email.com',
      subtotal: 28500,
      tax: 5415,
      tip: 0,
      total: 33915,
      notes: 'Cliente solicitó atención',
      items: {
        create: [
          {
            productId: products[2].id,
            quantity: 2,
            price: 24000,
          },
          {
            productId: products[11].id,
            quantity: 1,
            price: 4500,
          },
        ],
      },
    },
  });

  // Orden 5 - Para llevar
  const order5 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-005',
      type: OrderType.TAKEAWAY,
      status: OrderStatus.PREPARING,
      customerName: 'Ana Rodríguez',
      customerEmail: 'ana@email.com',
      userId: worker.id,
      subtotal: 45000,
      tax: 8550,
      tip: 0,
      total: 53550,
      items: {
        create: [
          {
            productId: products[1].id, // Combo Pareja
            quantity: 1,
            price: 45000,
          },
        ],
      },
    },
  });

  console.log('✅ 5 órdenes de ejemplo creadas');

  console.log('✨ Seed completado exitosamente!');
  console.log('\n📊 Resumen:');
  console.log(`   - Usuarios: ${admin.name} (Admin), ${worker.name} (Worker)`);
  console.log(`   - Password para ambos: 123456`);
  console.log(`   - Mesas: 10`);
  console.log(`   - Categorías: 5`);
  console.log(`   - Productos: 20`);
  console.log(`   - Órdenes: 5`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error en seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
