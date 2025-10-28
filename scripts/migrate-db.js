/**
 * Script para ejecutar migraciones SQL en la base de datos de producción
 * Ejecutar con: node scripts/migrate-db.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigrations() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    
    // Parsear DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    const matches = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    if (!matches) {
      throw new Error('URL de base de datos inválida');
    }
    
    const [, user, password, host, port, database] = matches;
    
    connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user,
      password,
      database,
      charset: 'utf8mb4'
    });
    
    console.log('✅ Conexión establecida\n');
    
    // 1. Verificar charset actual
    console.log('📊 Verificando charset actual...');
    const [charset] = await connection.query('SHOW VARIABLES LIKE "character_set%"');
    console.table(charset);
    
    // 2. Agregar campo 'active' a la tabla User
    console.log('\n🔧 Agregando campo "active" a tabla User...');
    try {
      await connection.query(`
        ALTER TABLE \`User\` 
        ADD COLUMN \`active\` BOOLEAN NOT NULL DEFAULT TRUE
      `);
      console.log('✅ Campo "active" agregado exitosamente');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  El campo "active" ya existe, continuando...');
      } else {
        throw error;
      }
    }
    
    // 3. Convertir base de datos a UTF-8
    console.log('\n🔧 Convirtiendo base de datos a UTF-8...');
    await connection.query(`
      ALTER DATABASE \`${database}\` 
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log('✅ Base de datos convertida');
    
    // 4. Convertir tablas a UTF-8
    console.log('\n🔧 Convirtiendo tablas a UTF-8...');
    const tables = [
      'User', 'Restaurant', 'Category', 'Product', 
      'Table', 'TableSession', 'Order', 'OrderItem', 
      'Review', 'InventoryItem'
    ];
    
    for (const table of tables) {
      try {
        await connection.query(`
          ALTER TABLE \`${table}\` 
          CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `);
        console.log(`  ✅ ${table}`);
      } catch (error) {
        console.log(`  ⚠️  ${table} - ${error.message}`);
      }
    }
    
    // 5. Verificar usuarios con encoding incorrecto
    console.log('\n📋 Verificando usuarios con problemas de encoding...');
    const [users] = await connection.query(`
      SELECT id, name, email, document, role, active 
      FROM \`User\` 
      WHERE name LIKE '%�%' OR name REGEXP '[^[:print:]]'
      ORDER BY name
    `);
    
    if (users.length > 0) {
      console.log(`\n⚠️  Encontrados ${users.length} usuarios con problemas de encoding:`);
      console.table(users);
      
      console.log('\n💡 Para corregir estos usuarios, ejecuta UPDATEs manuales:');
      console.log('   UPDATE `User` SET name = "María" WHERE id = "ID_DEL_USUARIO";');
    } else {
      console.log('✅ No se encontraron problemas de encoding en usuarios');
    }
    
    // 6. Mostrar todos los usuarios
    console.log('\n👥 Lista de todos los usuarios:');
    const [allUsers] = await connection.query(`
      SELECT id, name, email, document, role, active, createdAt 
      FROM \`User\` 
      ORDER BY createdAt DESC
    `);
    console.table(allUsers);
    
    console.log('\n✅ Migraciones completadas exitosamente!\n');
    
  } catch (error) {
    console.error('\n❌ Error ejecutando migraciones:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar migraciones
runMigrations();
