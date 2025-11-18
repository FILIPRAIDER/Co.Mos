// Script para arreglar encoding de dirección
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Arreglando encoding de direcciones...\n');
  
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: 'cmgzfzvac0000ud5kmm7t7awe' }
  });
  
  if (!restaurant) {
    console.log('❌ Restaurante no encontrado');
    return;
  }
  
  console.log(`🏪 Restaurante: ${restaurant.name}`);
  console.log(`📍 Dirección actual: ${restaurant.address}`);
  
  // Arreglar la dirección
  const fixedAddress = 'Calle 123 #45-67, Bogotá';
  
  await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: { address: fixedAddress }
  });
  
  console.log(`✅ Dirección actualizada: ${fixedAddress}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
