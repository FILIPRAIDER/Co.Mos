/**
 * Script para ejecutar migraciones usando Prisma
 * Ejecutar con: node scripts/migrate-prisma.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function runMigrations() {
  try {
    console.log('🔌 Conectando a la base de datos con Prisma...\n');
    
    // 1. Ejecutar migraciones SQL directamente
    console.log('🔧 Agregando campo "active" a tabla User...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`User\` 
        ADD COLUMN \`active\` BOOLEAN NOT NULL DEFAULT TRUE
      `);
      console.log('✅ Campo "active" agregado exitosamente\n');
    } catch (error) {
      if (error.message.includes('Duplicate column')) {
        console.log('⚠️  El campo "active" ya existe\n');
      } else {
        throw error;
      }
    }
    
    // 2. Verificar usuarios con encoding incorrecto
    console.log('📋 Buscando usuarios con problemas de encoding...');
    const usersWithIssues = await prisma.$queryRawUnsafe(`
      SELECT id, name, email, document, role
      FROM \`User\` 
      WHERE name LIKE '%�%'
      ORDER BY name
    `);
    
    if (usersWithIssues.length > 0) {
      console.log(`⚠️  Encontrados ${usersWithIssues.length} usuarios con problemas:\n`);
      usersWithIssues.forEach(user => {
        console.log(`  - ${user.name} (${user.document}) - ${user.role}`);
      });
      
      console.log('\n💡 Estos usuarios necesitan corrección manual en la base de datos');
      console.log('   Puedes usar el panel de Clever Cloud para ejecutar UPDATEs\n');
    } else {
      console.log('✅ No se encontraron problemas de encoding\n');
    }
    
    // 3. Mostrar todos los usuarios activos
    console.log('👥 Usuarios en el sistema:');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        document: true,
        role: true,
        restaurantId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\nTotal: ${allUsers.length} usuarios`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} - ${user.role} - ${user.document}`);
    });
    
    console.log('\n✅ Script completado exitosamente!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Desconectado de la base de datos');
  }
}

// Ejecutar
runMigrations();
