# 🚂 Deploy en Railway - Co.Mos

## Variables de Entorno Requeridas

Configura estas variables en tu proyecto de Railway:

```env
# Database
DATABASE_URL="tu_mysql_connection_string"

# NextAuth
NEXTAUTH_URL="https://tu-app.railway.app"
NEXTAUTH_SECRET="genera_un_secret_aleatorio"

# ImageKit (opcional)
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY="tu_public_key"
IMAGEKIT_PRIVATE_KEY="tu_private_key"
IMAGEKIT_URL_ENDPOINT="tu_url_endpoint"

# Socket.IO (Railway lo asigna automáticamente)
PORT=3000
NODE_ENV=production
```

## Pasos de Deployment

### 1. Crear Proyecto en Railway
```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Inicializar proyecto
railway init
```

### 2. Configurar Base de Datos
- Agrega un servicio MySQL desde el dashboard de Railway
- Copia el `DATABASE_URL` a las variables de entorno

### 3. Deploy
```bash
# Push a Railway
railway up

# O conecta tu repositorio de GitHub
# Railway detectará automáticamente los cambios
```

### 4. Ejecutar Migraciones
```bash
# Desde Railway CLI
railway run npx prisma db push

# O desde el dashboard > Deploy Logs
```

## Características Configuradas ✅

- ✅ **Socket.IO** funcionando en Railway
- ✅ **CORS** configurado para producción
- ✅ **Puerto dinámico** (Railway asigna automáticamente)
- ✅ **Reconexión automática** de websockets
- ✅ **Health checks** habilitados
- ✅ **Logs optimizados** para debugging

## Troubleshooting

### Socket.IO no conecta
1. Verifica que `NEXTAUTH_URL` esté configurado
2. Revisa los logs: `railway logs`
3. Asegúrate de que el puerto sea dinámico

### Errores de Database
```bash
# Regenerar Prisma Client
railway run npx prisma generate

# Aplicar migraciones
railway run npx prisma db push
```

### Performance
- Railway escala automáticamente
- Considera usar Redis para sesiones en producción
- Monitorea el uso de conexiones de base de datos

## Monitoreo

Ver logs en tiempo real:
```bash
railway logs --follow
```

Ver métricas:
```bash
railway status
```

---

**Documentación Railway:** https://docs.railway.app
