// Script para verificar encoding de restaurantes
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando encoding de restaurantes...\n');
  
  const restaurants = await prisma.restaurant.findMany();
  
  for (const restaurant of restaurants) {
    console.log(`🏪 ${restaurant.name}`);
    console.log(`   ID: ${restaurant.id}`);
    console.log(`   Dirección: ${restaurant.address || 'N/A'}`);
    
    // Detectar caracteres sospechosos
    if (restaurant.address) {
      const hasWeirdChars = /[\ufffd\u00bf\u00ef]/.test(restaurant.address);
      if (hasWeirdChars) {
        console.log(`   ⚠️ TIENE CARACTERES CORRUPTOS`);
        
        // Mostrar bytes
        const bytes = Buffer.from(restaurant.address, 'utf8');
        console.log(`   Bytes: ${bytes.toString('hex')}`);
      }
    }
    console.log('');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
