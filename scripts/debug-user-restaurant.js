// Debug: Ver usuario específico con su restaurante
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Mostrar el primer usuario ADMIN que encuentre
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    include: { restaurant: true }
  });
  
  if (!admin) {
    console.log('❌ No se encontró ningún usuario ADMIN');
    return;
  }
  
  console.log('👤 Usuario ADMIN:');
  console.log(`   Nombre: ${admin.name}`);
  console.log(`   Email: ${admin.email || 'N/A'}`);
  console.log(`   Document: ${admin.document}`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   RestaurantId: ${admin.restaurantId || '❌ NULL'}`);
  
  if (admin.restaurant) {
    console.log(`\n🏪 Restaurante:`);
    console.log(`   Nombre: ${admin.restaurant.name}`);
    console.log(`   ID: ${admin.restaurant.id}`);
    console.log(`   Dirección: ${admin.restaurant.address || 'N/A'}`);
  } else {
    console.log('\n❌ Este usuario NO tiene restaurante asignado');
  }
  
  // Probar getCurrentRestaurant simulando sesión
  console.log('\n🔍 Probando lógica de getCurrentRestaurant...');
  
  const currentUser = await prisma.user.findUnique({
    where: { document: admin.document },
    include: { restaurant: true }
  });
  
  if (!currentUser) {
    console.log('❌ No se pudo encontrar usuario por document');
    return;
  }
  
  if (!currentUser.restaurantId) {
    console.log('❌ currentUser.restaurantId es NULL');
    console.log('⚠️ Esto causaría el error en servicio!');
    return;
  }
  
  console.log('✅ currentUser.restaurantId existe:', currentUser.restaurantId);
  console.log('✅ El usuario debería poder acceder a servicio');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
