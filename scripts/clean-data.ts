import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Limpiando datos...');

  // Eliminar en orden para respetar las foreign keys
  await prisma.review.deleteMany({});
  console.log('✅ Reviews eliminadas');

  await prisma.orderItem.deleteMany({});
  console.log('✅ OrderItems eliminados');

  await prisma.order.deleteMany({});
  console.log('✅ Orders eliminadas');

  await prisma.tableSession.deleteMany({});
  console.log('✅ TableSessions eliminadas');

  await prisma.table.deleteMany({});
  console.log('✅ Tables eliminadas');

  console.log('✨ Base de datos limpiada exitosamente');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
