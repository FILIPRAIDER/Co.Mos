import ImageKit from 'imagekit';

// Configuración de ImageKit usando variables de entorno
export const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || ''
});

/**
 * Sube una imagen a ImageKit desde un buffer o base64
 * @param file - Buffer o string base64 de la imagen
 * @param fileName - Nombre del archivo
 * @param folder - Carpeta en ImageKit (ej: 'restaurants', 'products', 'qr-codes')
 * @returns URL de la imagen subida
 */
export async function uploadImage(
  file: Buffer | string,
  fileName: string,
  folder: string = 'general'
): Promise<string> {
  try {
    const response = await imagekit.upload({
      file, // Base64 string or buffer
      fileName,
      folder: `/co.mos/${folder}`, // Organizamos por carpetas
      useUniqueFileName: true, // Para evitar colisiones
    });

    return response.url;
  } catch (error) {
    console.error('Error uploading to ImageKit:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Elimina una imagen de ImageKit
 * @param fileId - ID del archivo en ImageKit
 */
export async function deleteImage(fileId: string): Promise<void> {
  try {
    await imagekit.deleteFile(fileId);
  } catch (error) {
    console.error('Error deleting from ImageKit:', error);
    throw new Error('Failed to delete image');
  }
}

/**
 * Obtiene la URL optimizada de una imagen
 * @param path - Path relativo de la imagen en ImageKit
 * @param width - Ancho deseado
 * @param height - Alto deseado
 * @returns URL optimizada
 */
export function getOptimizedImageUrl(
  path: string,
  width?: number,
  height?: number
): string {
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/ujhv2g173';
  const transformations: string[] = [];
  
  if (width) transformations.push(`w-${width}`);
  if (height) transformations.push(`h-${height}`);
  transformations.push('q-80'); // Calidad 80%
  transformations.push('f-auto'); // Formato automático (WebP si es soportado)

  const transformation = transformations.join(',');
  return `${urlEndpoint}/tr:${transformation}/${path}`;
}
