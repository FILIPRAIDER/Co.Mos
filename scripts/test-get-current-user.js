// Test para simular el flujo de getCurrentRestaurant
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testGetCurrentUser() {
  console.log('🧪 Simulando getCurrentUser con document "1003069860"...\n');
  
  // Simular la búsqueda que hace getCurrentUser
  const user = await prisma.user.findUnique({
    where: { document: '1003069860' },
    include: {
      restaurant: true,
    },
  });
  
  if (!user) {
    console.log('❌ Usuario NO encontrado');
    return;
  }
  
  console.log('✅ Usuario encontrado:');
  console.log(`   Document: ${user.document}`);
  console.log(`   Name: ${user.name}`);
  console.log(`   RestaurantId: ${user.restaurantId || '❌ NULL'}`);
  
  if (!user.restaurantId || !user.restaurant) {
    console.log('\n❌ PROBLEMA: Usuario no tiene restaurantId o restaurant');
    console.log('   Esto haría que getCurrentRestaurant() lance error');
    return;
  }
  
  console.log(`\n✅ Restaurant obtenido correctamente:`);
  console.log(`   ID: ${user.restaurant.id}`);
  console.log(`   Name: ${user.restaurant.name}`);
  console.log('\n✅ getCurrentRestaurant() debería funcionar correctamente');
}

testGetCurrentUser()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
