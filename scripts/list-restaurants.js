// Script para ver restaurantes
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🏪 Restaurantes:\n');
  
  const restaurants = await prisma.restaurant.findMany({
    include: {
      _count: {
        select: {
          orders: true,
          tables: true,
          users: true
        }
      }
    }
  });
  
  restaurants.forEach(r => {
    console.log(`📍 ${r.name}`);
    console.log(`   ID: ${r.id}`);
    console.log(`   Dirección: ${r.address || 'N/A'}`);
    console.log(`   Órdenes: ${r._count.orders}`);
    console.log(`   Mesas: ${r._count.tables}`);
    console.log(`   Usuarios: ${r._count.users}`);
    console.log('');
  });
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
