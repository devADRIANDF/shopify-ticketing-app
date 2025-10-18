# Configuración de Variables de Entorno en Vercel

## ⚠️ CRÍTICO: Sin estas variables la app NO funcionará

El error "500: INTERNAL_SERVER_ERROR" que estás viendo es porque **faltan las variables de entorno en Vercel**.

## 📝 Pasos para Configurar

### 1. Ve a Vercel Dashboard

1. Abre [https://vercel.com](https://vercel.com)
2. Selecciona tu proyecto `shopify-ticketing-app`
3. Click en **Settings** (arriba)
4. Click en **Environment Variables** (menú izquierdo)

### 2. Agrega TODAS estas Variables

**Copia y pega cada una exactamente como está:**

#### Variables REQUERIDAS (Sin estas la app falla):

| Name | Value |
|------|-------|
| `SHOPIFY_API_KEY` | `cc4511f9341d22ee8d454f3d2c1200fe` |
| `SHOPIFY_API_SECRET` | `952db292a707db19abd266ca3347c200` |
| `SHOPIFY_APP_URL` | `https://shopify-ticketing-app.vercel.app` |
| `DATABASE_URL` | `postgresql://postgres.pbddvlgjallejkczsizt:Validiam123!@aws-1-eu-north-1.pooler.supabase.com:5432/postgres` |
| `ENCRYPTION_KEY` | `zpR1D3mL9kFwQ7cT6nHxY5VaUcEt0G2b` |
| `SCOPES` | `write_products,read_orders,read_customers,write_customers` |

#### Variables Opcionales (para emails):

| Name | Value |
|------|-------|
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USER` | `validiamtickets@gmail.com` |
| `EMAIL_PASSWORD` | `sedeasde11` |
| `EMAIL_FROM` | `Validiam <noreply@validiam.com>` |

### 3. Para cada variable:

1. Click en **Add New**
2. En "Key" (Name): Pega el nombre (ej: `SHOPIFY_API_KEY`)
3. En "Value": Pega el valor (ej: `cc4511f9341d22ee8d454f3d2c1200fe`)
4. En "Environments": Selecciona **Production**, **Preview**, **Development**
5. Click en **Save**

### 4. Redeploy Después de Agregar Variables

**IMPORTANTE:** Después de agregar TODAS las variables:

1. Ve a **Deployments**
2. Click en el último deployment
3. Click en los tres puntos (...) → **Redeploy**
4. Espera 2-3 minutos

## 🔍 Verificar que las Variables Estén Configuradas

Después de agregarlas, en Settings → Environment Variables deberías ver:
- ✅ SHOPIFY_API_KEY
- ✅ SHOPIFY_API_SECRET
- ✅ SHOPIFY_APP_URL
- ✅ DATABASE_URL
- ✅ ENCRYPTION_KEY
- ✅ SCOPES

**Si falta alguna, la app NO funcionará.**

## 🚀 Después del Redeploy

1. Espera a que el deployment diga **Ready** (verde)
2. Ve a Shopify admin → Apps → Abre "validiam"
3. Deberías ver el dashboard sin errores

## 🐛 Si Sigue Fallando

1. Ve a Vercel → Deployments → Click en el último deployment
2. Click en la pestaña **Runtime Logs** o **Function Logs**
3. Copia el error que aparece en rojo y compártelo

El log te dirá exactamente qué variable falta o qué está fallando.
