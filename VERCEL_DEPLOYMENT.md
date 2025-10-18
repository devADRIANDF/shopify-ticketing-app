# Deployment en Vercel - Instrucciones

## Cambios Realizados

Se ha corregido la configuración del proyecto para usar **Remix con Node.js server** en Vercel.

### Problema Original:
- Error: `Cannot find module '/var/task/build/index.js'`
- Las serverless functions no tenían acceso al build directory

### Solución Implementada:
- Cambio de **serverless functions** a **Node.js server** persistente
- Mejor compatibilidad con Remix en Vercel

### Archivos modificados:
1. **package.json** - Agregado Express, actualizado start script
2. **server.js** - Servidor Express para Remix (NUEVO)
3. **vercel.json** - Configuración para Node.js server
4. **vite.config.ts** - Configuración de build optimizada
5. **shopify.app.toml** - URLs actualizadas

## Pasos para Deployar

### 1. Commit y Push de los cambios

```bash
git add .
git commit -m "fix: Configure Remix for Vercel deployment"
git push origin master
```

### 2. Configurar Variables de Entorno en Vercel

Ve a tu proyecto en Vercel → Settings → Environment Variables y agrega:

**REQUERIDAS:**
```
SHOPIFY_API_KEY=cc4511f9341d22ee8d454f3d2c1200fe
SHOPIFY_API_SECRET=952db292a707db19abd266ca3347c200
DATABASE_URL=postgresql://postgres.pbddvlgjallejkczsizt:Validiam123!@aws-1-eu-north-1.pooler.supabase.com:5432/postgres
ENCRYPTION_KEY=zpR1D3mL9kFwQ7cT6nHxY5VaUcEt0G2b
SHOPIFY_APP_URL=https://shopify-ticketing-app.vercel.app
NODE_ENV=production
SCOPES=write_products,read_orders,read_customers,write_customers
```

**OPCIONALES (para emails):**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=validiamtickets@gmail.com
EMAIL_PASSWORD=sedeasde11
EMAIL_FROM=Validiam <noreply@validiam.com>
```

### 3. Redeploy en Vercel

1. Ve a tu proyecto en Vercel
2. Click en **Deployments**
3. Click en los tres puntos del último deployment
4. Selecciona **Redeploy**

O simplemente haz push a GitHub y Vercel lo detectará automáticamente.

### 4. Actualizar Shopify App Configuration

1. Ve a [Shopify Partners](https://partners.shopify.com)
2. Selecciona tu app "validiam"
3. Ve a **Configuration** → **App URL**
4. Actualiza:
   - **App URL**: `https://shopify-ticketing-app.vercel.app`
   - **Allowed redirection URL(s)**:
     ```
     https://shopify-ticketing-app.vercel.app/auth/callback
     https://shopify-ticketing-app.vercel.app/auth/shopify/callback
     https://shopify-ticketing-app.vercel.app/api/auth/callback
     ```

### 5. Verificar Database (Supabase)

Asegúrate de que las migraciones de Prisma se hayan ejecutado:

```bash
# Si es necesario, ejecuta localmente:
npx prisma migrate deploy
```

## Troubleshooting

### Error 500: FUNCTION_INVOCATION_FAILED

**Posibles causas:**
1. Variables de entorno faltantes en Vercel
2. Database no accesible desde Vercel
3. Build incompleto

**Soluciones:**
1. Verifica que todas las variables de entorno estén configuradas
2. Revisa los logs en Vercel: `Dashboard → Deployments → [último deployment] → Function Logs`
3. Asegúrate de que Supabase permita conexiones desde Vercel

### Error 404: NOT_FOUND

**Solución:**
- Verifica que el archivo `api/index.js` exista
- Verifica que `vercel.json` tenga las rutas correctas
- Haz un redeploy completo

## Verificación Final

Una vez deployado, visita:
- `https://shopify-ticketing-app.vercel.app` - Debe redirigir a Shopify auth
- `https://shopify-ticketing-app.vercel.app/app` - Dashboard de la app (requiere auth)

## Soporte

Si el problema persiste:
1. Revisa los logs en Vercel
2. Verifica que el build se completó exitosamente
3. Comprueba que las variables de entorno sean correctas
