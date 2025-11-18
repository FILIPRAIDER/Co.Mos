// Script para verificar y arreglar el enlace restaurante-admin
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando usuarios ADMIN...\n');
  
  // Buscar todos los usuarios ADMIN
  const admins = await prisma.user.findMany({
    where: {
      role: 'ADMIN'
    },
    include: {
      restaurant: true
    }
  });
  
  console.log(`📊 Total de usuarios ADMIN: ${admins.length}\n`);
  
  for (const admin of admins) {
    console.log(`👤 Usuario: ${admin.name} (${admin.email || admin.document})`);
    
    if (admin.restaurantId) {
      console.log(`   ✅ Tiene restaurante: ${admin.restaurant?.name || admin.restaurantId}`);
    } else {
      console.log(`   ❌ NO tiene restaurante asignado`);
      
      // Buscar restaurantes disponibles
      const restaurants = await prisma.restaurant.findMany();
      
      if (restaurants.length === 0) {
        console.log(`   ⚠️ No hay restaurantes en la base de datos`);
      } else if (restaurants.length === 1) {
        console.log(`   💡 Hay 1 restaurante disponible: ${restaurants[0].name}`);
        console.log(`   🔧 Asignando restaurante al usuario...`);
        
        await prisma.user.update({
          where: { id: admin.id },
          data: { restaurantId: restaurants[0].id }
        });
        
        console.log(`   ✅ Restaurante asignado exitosamente`);
      } else {
        console.log(`   💡 Hay ${restaurants.length} restaurantes disponibles:`);
        restaurants.forEach((r, i) => {
          console.log(`      ${i + 1}. ${r.name} (${r.id})`);
        });
        console.log(`   ⚠️ Por favor asigna manualmente el restaurante correcto`);
      }
    }
    console.log('');
  }
  
  console.log('✅ Verificación completada');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
