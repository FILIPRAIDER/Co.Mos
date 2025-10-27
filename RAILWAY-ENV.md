# Configuración de Variables de Entorno en Railway

## Variables Requeridas en Railway

Configura estas variables de entorno en tu proyecto de Railway:

```env
# URL de la aplicación en producción
NEXTAUTH_URL=https://comos-production.up.railway.app

# Secret para NextAuth (debe ser el mismo que en .env)
NEXTAUTH_SECRET=12345549874426546hlhjghfsw

# Database URL (ya configurada automáticamente por Railway si usas su MySQL)
DATABASE_URL=mysql://...

# ImageKit (si usas imágenes)
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_2PLQoaigQapCg8Qiazira3M7hn0=
IMAGEKIT_PRIVATE_KEY=private_m1J8jm2B0iOYrJomR5NaQUEhOY8=
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/ujhv2g173

# Prisma
PRISMA_MIGRATE_SKIP_SEED=true
```

## Importante

- **NEXTAUTH_URL** debe ser la URL completa de tu aplicación en Railway
- Si cambias el dominio de Railway, debes actualizar NEXTAUTH_URL
- Los QR codes se generan con esta URL, así que es crítico que esté bien configurada

## Verificar Variables

Para verificar que las variables están bien configuradas en Railway:

1. Ve a tu proyecto en Railway
2. Haz clic en "Variables"
3. Asegúrate que `NEXTAUTH_URL` tenga el valor correcto
4. Después de cambiar variables, Railway redesplegará automáticamente

## Desarrollo Local

Para desarrollo local, usa `.env.local` (no lo subas a git):

```env
NEXTAUTH_URL=http://localhost:3000
```
