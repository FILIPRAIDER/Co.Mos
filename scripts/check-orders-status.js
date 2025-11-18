// Script para ver órdenes actuales
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('📋 Órdenes actuales:\n');
  
  const orders = await prisma.order.findMany({
    where: {
      status: {
        in: ['PENDIENTE', 'ACEPTADA', 'PREPARANDO', 'LISTA', 'ENTREGADA', 'COMPLETADA']
      }
    },
    include: {
      table: true,
      session: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  });
  
  console.log(`Total de órdenes activas: ${orders.length}\n`);
  
  const statusCounts = {};
  orders.forEach(o => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });
  
  console.log('📊 Por estado:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });
  console.log('');
  
  console.log('📝 Detalles:\n');
  orders.forEach(order => {
    const statusEmoji = {
      'PENDIENTE': '⏳',
      'ACEPTADA': '✅',
      'PREPARANDO': '👨‍🍳',
      'LISTA': '🍽️',
      'ENTREGADA': '🚚',
      'COMPLETADA': '✔️',
      'PAGADA': '💰'
    };
    
    console.log(`${statusEmoji[order.status] || '❓'} ${order.orderNumber} - Mesa ${order.table?.number || 'SIN MESA'}`);
    console.log(`   Estado: ${order.status}`);
    console.log(`   Restaurante: ${order.restaurantId}`);
    console.log(`   Mesa ID: ${order.tableId || 'N/A'}`);
    console.log(`   Sesión: ${order.session?.sessionCode || 'N/A'}`);
    console.log(`   Cliente: ${order.customerName}`);
    console.log(`   Creado: ${order.createdAt.toLocaleString()}`);
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
