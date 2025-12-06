# 🛡️ SEGURIDAD Y MANTENIMIENTO - AffiliateNexus

## 🔐 SECRETS GENERADOS

**⚠️ IMPORTANTE: Copia estos valores a tu archivo `.env` AHORA**

```env
ADMIN_PASSWORD="KejQf$^Pt*s31RJr2jbT"
NEXTAUTH_SECRET="8UkjgZm1puNHLkc+V5m2Daji3eGnaRty8sxFWXe5gno="
CRON_SECRET="BsBAcBhESxRkfBverSensh2h6A54BQdQ"
```

### Regenerar Secrets
Si necesitas nuevos secrets en el futuro:
```bash
npm run generate:secrets
```

---

## 🧹 SCRIPTS DE MANTENIMIENTO

### 1. Limpieza de Imágenes Huérfanas
Elimina imágenes en `/public/uploads/` que ya no están referenciadas en la base de datos.

**Uso:**
```bash
npm run clean:images
```

**Frecuencia recomendada:** Mensual

**Ejemplo de salida:**
```
🧹 Starting image cleanup...

📊 Found 15 images referenced in database
📁 Found 20 files in uploads directory

🗑️  Deleted: product-1234567890.jpg (345.50 KB)
🗑️  Deleted: product-9876543210.jpg (412.30 KB)

✅ Cleanup complete!
   Deleted: 5 files
   Freed: 1.24 MB
```

---

### 2. Limpieza de Borradores Antiguos
Elimina borradores (posts con `[DRAFT]` en el título) más antiguos que X días.

**Uso:**
```bash
# Eliminar borradores de más de 30 días (por defecto)
npm run clean:drafts

# Eliminar borradores de más de 7 días
npm run clean:drafts 7

# Eliminar borradores de más de 60 días
npm run clean:drafts 60
```

**Frecuencia recomendada:** Mensual

**Ejemplo de salida:**
```
🧹 Cleaning drafts older than 30 days...

📊 Found 3 old drafts to delete:

   • [DRAFT] AI Health Tracker
     Age: 45 days | Slug: draft-ai-health-tracker-123

   • [DRAFT] Smart Garden Kit
     Age: 32 days | Slug: draft-smart-garden-kit-456

✅ Deleted 3 old drafts successfully!
💡 Tip: Run this monthly to keep database clean
```

---

## 🚦 RATE LIMITING

### Protección Implementada

**Endpoint Protegido:** `/api/cron/auto-post`

- **Límite:** 5 requests por hora por IP
- **Headers de respuesta:**
  ```
  X-RateLimit-Limit: 5
  X-RateLimit-Remaining: 4
  X-RateLimit-Reset: 1733521200
  ```

**Respuesta cuando se excede el límite:**
```json
{
  "error": "Rate limit exceeded. Try again later."
}
```
**Status:** `429 Too Many Requests`

### ¿Por qué Rate Limiting?

1. **Protege tu API Key de Gemini** (límite: 15 RPM en free tier)
2. **Previene abuso** de endpoints públicos
3. **Ahorra costes** de base de datos y AI
4. **Mejora estabilidad** del servidor

---

## 📊 MONITOREO DE RECURSOS

### Imágenes
```bash
# Ver cuánto espacio ocupan las imágenes
Get-ChildItem -Path "public/uploads" -Recurse | Measure-Object -Property Length -Sum

# O en Linux/Mac:
# du -sh public/uploads
```

### Base de Datos
```bash
# Ver campañas totales
npx prisma studio
# Luego navega a Campaign y verás el contador

# O ejecuta SQL directo:
npx prisma db execute --stdin
# SELECT COUNT(*) FROM "Campaign";
```

### Borradores Acumulados
```bash
# Contar borradores pendientes
npx prisma studio
# Filtra por productName contains "[DRAFT]"
```

---

## 🔄 AUTOMATIZACIÓN CON CRON JOBS

### Setup en Vercel

1. **Ir a tu proyecto en Vercel**
2. **Settings > Cron Jobs**
3. **Añadir nuevo Cron Job:**

#### Auto-Pilot (Generación semanal)
```
Name: auto-content-generation
Schedule: 0 9 * * 1  (Lunes 9 AM)
URL: /api/cron/auto-post?key=[TU_CRON_SECRET]
```

#### Limpieza de Borradores (Mensual)
Crear archivo `/api/cron/clean-drafts/route.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  
  if (key !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prisma = new PrismaClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);

  const result = await prisma.campaign.deleteMany({
    where: {
      productName: { contains: '[DRAFT]' },
      createdAt: { lt: cutoffDate }
    }
  });

  await prisma.$disconnect();
  
  return Response.json({ deleted: result.count });
}
```

Luego en Vercel Cron:
```
Name: monthly-draft-cleanup
Schedule: 0 3 1 * *  (Día 1 de cada mes a las 3 AM)
URL: /api/cron/clean-drafts?key=[TU_CRON_SECRET]
```

---

## ⚠️ CHECKLIST DE SEGURIDAD PRE-PRODUCCIÓN

Antes de deployar a producción, verifica:

- [ ] ✅ Secrets generados y copiados a `.env`
- [ ] ✅ `ADMIN_PASSWORD` cambiado del valor por defecto
- [ ] ✅ `NEXTAUTH_SECRET` único y largo (mínimo 32 chars)
- [ ] ✅ `CRON_SECRET` protegido y aleatorio
- [ ] ✅ `.env` incluido en `.gitignore`
- [ ] ✅ `NEXT_PUBLIC_BASE_URL` apunta a tu dominio real
- [ ] ✅ Variables de entorno configuradas en Vercel
- [ ] ✅ HTTPS habilitado (automático en Vercel)
- [ ] ✅ Rate limiting activo en `/api/cron/*`
- [ ] ✅ Cron jobs configurados (opcional)

---

## 🎯 MEJORES PRÁCTICAS

### Secrets Management

**❌ NUNCA:**
- Commitear `.env` a git
- Compartir secrets por email sin cifrar
- Usar valores por defecto en producción
- Reutilizar secrets entre proyectos

**✅ SIEMPRE:**
- Rotar secrets cada 6 meses
- Usar variables de entorno en Vercel
- Generar secrets aleatorios criptográficamente
- Tener backup de secrets en gestor seguro (1Password, LastPass)

### Limpieza de Datos

**Frecuencia Recomendada:**
- **Imágenes:** Cada 30 días
- **Borradores:** Cada 30 días
- **Logs (si implementas):** Cada 7 días

### Backups

**Backup Manual (PostgreSQL):**
```bash
# En Vercel Postgres Dashboard:
# 1. Go to Storage > Postgres > [Your DB]
# 2. Settings > Backups
# 3. Create Backup Now
```

**Automatizado:** Vercel PostgreSQL hace backups diarios automáticos.

---

## 🚨 TROUBLESHOOTING

### "Rate limit exceeded"
**Causa:** Demasiadas requests en poco tiempo  
**Solución:** Esperar 1 hora o aumentar límite en `src/lib/rate-limit.ts`

### Secrets no funcionan
**Causa:** No están en `.env` o Vercel env vars  
**Solución:** 
```bash
# Vercel CLI
vercel env add NEXTAUTH_SECRET
# Pega el secret generado

vercel env add ADMIN_PASSWORD
vercel env add CRON_SECRET
```

### Imágenes no se borran
**Causa:** Permisos de carpeta `public/uploads/`  
**Solución:** 
```bash
# Dar permisos de escritura
chmod -R 755 public/uploads
```

---

## 📈 MÉTRICAS A MONITOREAR

### KPIs de Seguridad
- Intentos de login fallidos
- Requests bloqueados por rate limit
- Uso de API Key (Gemini dashboard)

###KPIs de Performance
- Tiempo de respuesta de `/api/cron/auto-post`
- Tamaño de carpeta `uploads/`
- Número de campañas vs borradores

### KPIs de Negocio
- Campañas creadas por mes
- Clicks en enlaces de afiliados
- Tasa de conversión draft → published

---

**✨ Sistema de Seguridad y Mantenimiento Implementado**  
**Última actualización:** Diciembre 2024
