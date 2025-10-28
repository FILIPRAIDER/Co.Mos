-- Script para corregir problemas de encoding en la base de datos
-- Ejecutar en el panel de Clever Cloud (Console > MySQL > SQL)

-- ========================================
-- PASO 1: Agregar campo 'active' a User
-- ========================================
ALTER TABLE `User` ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT TRUE;

-- ========================================
-- PASO 2: Convertir base de datos a UTF-8
-- ========================================
-- Reemplaza 'bpzfrgaawz0dnj11cwai' con tu nombre de base de datos
ALTER DATABASE `bpzfrgaawz0dnj11cwai` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ========================================
-- PASO 3: Convertir todas las tablas
-- ========================================
ALTER TABLE `User` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Restaurant` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Category` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Product` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Table` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `TableSession` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Order` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `OrderItem` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Review` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `InventoryItem` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ========================================
-- PASO 4: Ver usuarios con problemas
-- ========================================
SELECT id, name, email, document, role 
FROM `User` 
WHERE name LIKE '%�%' 
ORDER BY name;

-- ========================================
-- PASO 5: Corregir nombres (EJEMPLOS)
-- ========================================
-- Copia el ID de los usuarios del SELECT anterior y ajusta estos UPDATEs:

-- UPDATE `User` SET name = 'María González' WHERE id = 'ID_AQUI';
-- UPDATE `User` SET name = 'Andrés Martínez' WHERE id = 'ID_AQUI';
-- UPDATE `User` SET name = 'José Rodríguez' WHERE id = 'ID_AQUI';
-- UPDATE `User` SET name = 'Sofía Pérez' WHERE id = 'ID_AQUI';

-- ========================================
-- PASO 6: Verificar los cambios
-- ========================================
SELECT id, name, email, role, active, createdAt 
FROM `User` 
ORDER BY createdAt DESC;

