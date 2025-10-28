/**
 * Script para agregar campo mustChangePassword
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMustChangePasswordField() {
  try {
    console.log('🔧 Agregando campo "mustChangePassword" a tabla User...\n');
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`User\` 
      ADD COLUMN \`mustChangePassword\` BOOLEAN NOT NULL DEFAULT FALSE
    `);
    
    console.log('✅ Campo "mustChangePassword" agregado exitosamente\n');
    
    // Marcar usuarios existentes con contraseña temporal para que cambien
    const result = await prisma.$executeRawUnsafe(`
      UPDATE \`User\` 
      SET \`mustChangePassword\` = TRUE 
      WHERE \`role\` IN ('MESERO', 'COCINERO')
    `);
    
    console.log(`✅ ${result} usuarios marcados para cambiar contraseña\n`);
    
    console.log('👥 Estado de usuarios:');
    const users = await prisma.user.findMany({
      select: {
        name: true,
        role: true,
        mustChangePassword: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.table(users);
    
  } catch (error) {
    if (error.message.includes('Duplicate column')) {
      console.log('⚠️  El campo "mustChangePassword" ya existe');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

addMustChangePasswordField();
