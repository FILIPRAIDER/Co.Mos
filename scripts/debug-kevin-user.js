// Debug completo del usuario Kevin Morelo
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Buscando usuario Kevin Morelo...\n');
  
  // Buscar por cédula
  const user = await prisma.user.findUnique({
    where: { document: '1003069860' },
    include: { restaurant: true }
  });
  
  if (!user) {
    console.log('❌ Usuario no encontrado');
    return;
  }
  
  console.log('👤 Usuario encontrado:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Nombre: ${user.name}`);
  console.log(`   Email: ${user.email || '❌ NULL'}`);
  console.log(`   Document: ${user.document}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   RestaurantId: ${user.restaurantId || '❌ NULL'}`);
  console.log(`   Active: ${user.active}`);
  
  if (!user.restaurantId) {
    console.log('\n⚠️ PROBLEMA: Este usuario NO tiene restaurantId');
    
    // Ver qué restaurante es "Co.mos" con minúsculas
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        name: {
          contains: 'Co.mos'
        }
      }
    });
    
    if (restaurant) {
      console.log(`\n💡 Restaurante encontrado: ${restaurant.name} (${restaurant.id})`);
      console.log('🔧 Asignando restaurante al usuario...');
      
      await prisma.user.update({
        where: { id: user.id },
        data: { restaurantId: restaurant.id }
      });
      
      console.log('✅ Restaurante asignado exitosamente!');
    }
    return;
  }
  
  console.log(`\n🏪 Restaurante:`);
  console.log(`   Nombre: ${user.restaurant?.name}`);
  console.log(`   ID: ${user.restaurant?.id}`);
  
  // Contar órdenes del restaurante
  const orderCounts = await prisma.order.groupBy({
    by: ['status'],
    where: { restaurantId: user.restaurantId },
    _count: true
  });
  
  console.log('\n📊 Órdenes por estado:');
  orderCounts.forEach(({ status, _count }) => {
    console.log(`   ${status}: ${_count}`);
  });
  
  // Ver órdenes "en curso"
  const activosOrders = await prisma.order.count({
    where: {
      restaurantId: user.restaurantId,
      status: {
        notIn: ['PAGADA', 'CANCELADA']
      }
    }
  });
  
  console.log(`\n📋 Órdenes "en curso" (no pagadas/canceladas): ${activosOrders}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
