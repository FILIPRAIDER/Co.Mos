/**
 * Script para corregir nombres con encoding incorrecto
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixNames() {
  try {
    console.log('🔧 Corrigiendo nombres con encoding incorrecto...\n');
    
    // Obtener usuarios con problemas
    const users = await prisma.$queryRawUnsafe(`
      SELECT id, name, document 
      FROM \`User\` 
      WHERE name LIKE '%�%'
    `);
    
    if (users.length === 0) {
      console.log('✅ No hay nombres para corregir');
      return;
    }
    
    console.log(`Encontrados ${users.length} usuarios para corregir:\n`);
    
    // Corregir cada usuario
    for (const user of users) {
      let correctedName = user.name;
      
      // Detectar y corregir patrones comunes
      if (user.name.includes('Mar�a')) {
        correctedName = user.name.replace('Mar�a', 'María');
      }
      if (user.name.includes('Mart�nez')) {
        correctedName = user.name.replace('Mart�nez', 'Martínez');
      }
      if (user.name.includes('Gonz�lez')) {
        correctedName = user.name.replace('Gonz�lez', 'González');
      }
      if (user.name.includes('Andr�s')) {
        correctedName = user.name.replace('Andr�s', 'Andrés');
      }
      if (user.name.includes('Jos�')) {
        correctedName = user.name.replace('Jos�', 'José');
      }
      if (user.name.includes('P�rez')) {
        correctedName = user.name.replace('P�rez', 'Pérez');
      }
      if (user.name.includes('Sof�a')) {
        correctedName = user.name.replace('Sof�a', 'Sofía');
      }
      
      console.log(`  ${user.name} → ${correctedName}`);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { name: correctedName }
      });
    }
    
    console.log('\n✅ Nombres corregidos exitosamente!');
    
    // Verificar
    console.log('\n👥 Usuarios actualizados:');
    const updated = await prisma.user.findMany({
      where: {
        document: { in: users.map(u => u.document) }
      },
      select: { name: true, document: true, role: true }
    });
    
    updated.forEach(u => {
      console.log(`  - ${u.name} (${u.document}) - ${u.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixNames();
