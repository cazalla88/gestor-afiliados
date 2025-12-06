# 🚀 DEPLOY A VERCEL - GUÍA PASO A PASO

## 📋 PRE-REQUISITOS

Antes de empezar, necesitas:
- [ ] Cuenta en Vercel (gratuita en vercel.com)
- [ ] Git instalado
- [ ] Código commiteado a Git
- [ ] Los secrets generados anteriormente

---

## PASO 1: PREPARAR EL CÓDIGO 📦

### 1.1 Verificar archivos necesarios

Asegúrate de que estos archivos existen:
```
✅ package.json
✅ next.config.ts
✅ prisma/schema.prisma
✅ .gitignore (con .env incluido)
```

### 1.2 Commit final
```bash
# Ver estado
git status

# Añadir todos los cambios
git add .

# Commit
git commit -m "feat: production ready with security and maintenance features"

# Push to GitHub (si aún no lo has hecho)
# git remote add origin https://github.com/tu-usuario/tu-repo.git
# git push -u origin main
```

---

## PASO 2: CREAR PROYECTO EN VERCEL 🌐

### Opción A: Desde la Web (Recomendado)

1. **Ve a https://vercel.com/new**
2. **Conecta tu repositorio de GitHub**
   - Click en "Import Git Repository"
   - Selecciona el repositorio
   
3. **Configuración del proyecto:**
   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build (auto-detectado)
   Output Directory: .next (auto-detectado)
   Install Command: npm install
   ```

4. **NO HAGAS DEPLOY TODAVÍA**
   - Click en "Environment Variables" primero

### Opción B: Desde CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (modo interactivo)
vercel
```

---

## PASO 3: CONFIGURAR BASE DE DATOS 🗄️

### 3.1 Crear PostgreSQL Database en Vercel

1. **En tu proyecto de Vercel:**
   - Ve a "Storage" tab
   - Click "Create Database"
   - Selecciona "Postgres"
   - Region: Selecciona la más cercana a tus usuarios
   - Click "Create"

2. **Vercel automáticamente añadirá estas variables:**
   ```
   POSTGRES_URL
   POSTGRES_PRISMA_URL
   POSTGRES_URL_NON_POOLING
   POSTGRES_USER
   POSTGRES_HOST
   POSTGRES_PASSWORD
   POSTGRES_DATABASE
   ```

### 3.2 Ejecutar Migraciones de Prisma

```bash
# Método 1: Desde tu máquina local
# Copia POSTGRES_URL desde Vercel Dashboard
export POSTGRES_URL="postgresql://..."
npx prisma db push

# Método 2: Automático en deploy
# (Ya está configurado en package.json con postinstall)
```

---

## PASO 4: CONFIGURAR VARIABLES DE ENTORNO 🔐

### 4.1 Variables Obligatorias

En Vercel Dashboard > Settings > Environment Variables, añade:

```env
# Google AI (OBLIGATORIO)
NEXT_PUBLIC_GEMINI_API_KEY=AIza...tu_key_aqui
# O alternativamente:
GOOGLE_API_KEY=AIza...tu_key_aqui

# Seguridad (USA LOS GENERADOS)
ADMIN_USER=admin
ADMIN_PASSWORD=KejQf$^Pt*s31RJr2jbT
NEXTAUTH_SECRET=8UkjgZm1puNHLkc+V5m2Daji3eGnaRty8sxFWXe5gno=
CRON_SECRET=BsBAcBhESxRkfBverSensh2h6A54BQdQ

# URL Base (Cambiar después del primer deploy)
NEXT_PUBLIC_BASE_URL=https://tu-proyecto.vercel.app
```

### 4.2 Método Rápido con Vercel CLI

```bash
# Añadir variables una por una
vercel env add NEXT_PUBLIC_GEMINI_API_KEY
# Pegar el valor cuando te lo pida

vercel env add ADMIN_PASSWORD
vercel env add NEXTAUTH_SECRET
vercel env add CRON_SECRET
vercel env add NEXT_PUBLIC_BASE_URL
```

### 4.3 Importante: Seleccionar Ambientes

Para cada variable, selecciona:
- ✅ Production
- ✅ Preview
- ✅ Development

---

## PASO 5: DEPLOY! 🎉

### Desde Web
1. Click en "Deploy"
2. Espera 2-3 minutos
3. ¡Listo!

### Desde CLI
```bash
# Deploy a producción
vercel --prod
```

### Monitorear el Deploy
```bash
# Ver logs en tiempo real
vercel logs --follow
```

---

## PASO 6: CONFIGURACIÓN POST-DEPLOY ⚙️

### 6.1 Actualizar NEXT_PUBLIC_BASE_URL

Después del primer deploy, obtendrás una URL como:
```
https://gestor-afiliados-abc123.vercel.app
```

**Actualizar la variable:**
```bash
# Desde CLI
vercel env rm NEXT_PUBLIC_BASE_URL production
vercel env add NEXT_PUBLIC_BASE_URL production
# Pegar: https://tu-proyecto-real.vercel.app

# O desde dashboard:
# Settings > Environment Variables > Edit NEXT_PUBLIC_BASE_URL
```

**Redeploy:**
```bash
vercel --prod
```

### 6.2 Configurar Dominio Personalizado (Opcional)

1. **Vercel Dashboard > Settings > Domains**
2. **Añadir tu dominio:**
   ```
   tudominio.com
   www.tudominio.com
   ```
3. **Configurar DNS** según instrucciones de Vercel
4. **Actualizar** `NEXT_PUBLIC_BASE_URL=https://tudominio.com`

---

## PASO 7: CONFIGURAR CRON JOBS 🤖

### 7.1 Crear vercel.json

Crea este archivo en la raíz del proyecto:

```json
{
  "crons": [
    {
      "path": "/api/cron/auto-post?key=BsBAcBhESxRkfBverSensh2h6A54BQdQ",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

**Explicación:**
- `path`: Tu endpoint con el secret
- `schedule`: Lunes a las 9 AM UTC (cron format)

### 7.2 Formatos de Schedule Comunes

```
"0 9 * * 1"    → Lunes 9 AM
"0 0 * * *"    → Diario medianoche
"0 */6 * * *"  → Cada 6 horas
"0 0 1 * *"    → Primer día del mes
```

### 7.3 Commit y Deploy

```bash
git add vercel.json
git commit -m "feat: add cron jobs configuration"
git push
# Vercel auto-redeploy
```

### 7.4 Verificar Cron Jobs

En Vercel Dashboard:
- Settings > Cron Jobs
- Verás tu cron listado
- Puedes ejecutarlo manualmente con "Run Now"

---

## PASO 8: VERIFICACIÓN COMPLETA ✅

### 8.1 Test de Login
```
URL: https://tu-proyecto.vercel.app/login
Usuario: admin
Password: KejQf$^Pt*s31RJr2jbT
```

### 8.2 Test de Dashboard
```
URL: https://tu-proyecto.vercel.app/dashboard
Debe estar protegido y redirigir a /login si no estás autenticado
```

### 8.3 Test de Cron (Manual)
```bash
curl "https://tu-proyecto.vercel.app/api/cron/auto-post?key=BsBAcBhESxRkfBverSensh2h6A54BQdQ"
```

Respuesta esperada:
```json
{
  "success": true,
  "created": "draft-...",
  "trend": "...",
  "category": "..."
}
```

### 8.4 Test de Sitemap
```
URL: https://tu-proyecto.vercel.app/sitemap.xml
Debe mostrar XML con tus campañas
```

### 8.5 Test de Imágenes
1. Crear campaña con URL de Amazon
2. Verificar que imagen se descargue automáticamente
3. Check en `/uploads/` del servidor

---

## PASO 9: MONITOREO Y LOGS 📊

### Ver Logs en Vivo
```bash
vercel logs --follow
# O en Dashboard > Deployments > [Latest] > Logs
```

### Ver Cron Job Executions
```
Dashboard > Settings > Cron Jobs > View Executions
```

### Analytics (Opcional)
```
Dashboard > Analytics
```

---

## 🐛 TROUBLESHOOTING

### Error: "Database connection failed"
**Solución:**
```bash
# Verifica que las variables POSTGRES_* estén configuradas
vercel env ls

# Re-ejecuta prisma generate
vercel env pull .env.production
npx prisma generate
vercel --prod
```

### Error: "API Key Missing"
**Solución:**
```bash
# Verifica que NEXT_PUBLIC_GEMINI_API_KEY esté configurada
vercel env ls | grep GEMINI

# Añádela si falta
vercel env add NEXT_PUBLIC_GEMINI_API_KEY production
```

### Error: "NextAuth callback error"
**Causa:** `NEXTAUTH_SECRET` no configurado  
**Solución:**
```bash
vercel env add NEXTAUTH_SECRET production
# Pegar: 8UkjgZm1puNHLkc+V5m2Daji3eGnaRty8sxFWXe5gno=
vercel --prod
```

### Build falla
**Revisar:**
```bash
# Logs completos
vercel logs [deployment-id]

# Errores comunes:
# - Falta un import
# - Error de TypeScript
# - Dependencia faltante
```

### Cron no ejecuta
**Verificar:**
1. `vercel.json` commiteado
2. Path correcto (incluye `?key=`)
3. Schedule válido (usa https://crontab.guru)

---

## 📋 CHECKLIST FINAL

Antes de dar por terminado:

- [ ] ✅ Proyecto deploye sin errores
- [ ] ✅ Login funciona
- [ ] ✅ Dashboard protegido
- [ ] ✅ Base de datos conectada
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ NEXT_PUBLIC_BASE_URL apunta a dominio real
- [ ] ✅ Cron jobs configurados
- [ ] ✅ Test manual de cron exitoso
- [ ] ✅ Imágenes se descargan correctamente
- [ ] ✅ Sitemap se genera dinámicamente
- [ ] ✅ SEO metadata funciona

---

## 🎯 PRÓXIMOS PASOS DESPUÉS DEL DEPLOY

### Inmediato
1. **Cambiar URL en redes sociales**
2. **Probar creación de primera campaña**
3. **Configurar Google Search Console** (sitemap)

### Primera semana
1. **Monitorear logs de errores**
2. **Probar cron job automático** (esperar al lunes)
3. **Revisar uso de API Gemini**

### Primera mes  
1. **Ejecutar limpieza:** `npm run clean:drafts`
2. **Revisar analytics**
3. **Optimizar prompts de IA** según resultados

---

## 🚨 SEGURIDAD POST-DEPLOY

### Inmediato
```bash
# Rotar secrets si los compartiste durante testing
npm run generate:secrets

# Actualizar en Vercel
vercel env rm ADMIN_PASSWORD production
vercel env add ADMIN_PASSWORD production
# ... etc
```

### Monitoreo
- Configurar alertas en Vercel (Dashboard > Settings > Notifications)
- Monitor de uptime (opcional): uptimerobot.com

---

## 📚 RECURSOS ÚTILES

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deploy:** https://nextjs.org/docs/deployment
- **Prisma + Vercel:** https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel
- **Cron Jobs:** https://vercel.com/docs/cron-jobs

---

**🎉 ¡FELICIDADES! Tu aplicación está en producción**

---

**Creado por:** Antigravity AI  
**Fecha:** 2025-12-06
