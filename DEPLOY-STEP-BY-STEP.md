# 🚀 GUÍA VISUAL - DEPLOY EN VERCEL (5 MINUTOS)

## ✅ TODO ESTÁ LISTO

- ✅ Código en GitHub
- ✅ Variables de entorno preparadas
- ✅ Build exitoso localmente
- ✅ API Key configurada

---

## 📍 PASO A PASO

### PASO 1: Ir a Vercel Import
```
🌐 Abre en tu navegador:
https://vercel.com/new
```

Si no estás logueado, haz login con GitHub.

---

### PASO 2: Import Repository

1. Verás "Import Git Repository"
2. Busca: **cazalla88/gestor-afiliados**
3. Click en **"Import"**

📸 Deberías ver:
```
┌─────────────────────────────────┐
│ cazalla88/gestor-afiliados      │
│ [Import]                        │
└─────────────────────────────────┘
```

---

### PASO 3: Configurar Proyecto

Verás una pantalla con estas opciones:

```
Project Name: gestor-afiliados ✅ (puedes dejarlo así)
Framework Preset: Next.js ✅ (auto-detectado)
Root Directory: ./ ✅ (dejar por defecto)
Build Command: npm run build ✅ (auto-detectado)
Output Directory: .next ✅ (auto-detectado)
Install Command: npm install ✅ (auto-detectado)
```

**⚠️ NO HAGAS CLICK EN "Deploy" TODAVÍA**

---

### PASO 4: Añadir Variables de Entorno

1. **Scroll down** hasta ver "Environment Variables"
2. Click en **"Add Environment Variables"** o el símbolo **+**

Ahora copia y pega **UNA POR UNA** estas variables:

---

#### Variable 1 de 6:
```
┌─────────────────────────────────────┐
│ Key                                 │
├─────────────────────────────────────┤
│ NEXT_PUBLIC_GEMINI_API_KEY          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Value                               │
├─────────────────────────────────────┤
│ AIzaSyA-hlz0HhBd-F5A1E5h3JikNL0TiZYAu9c │
└─────────────────────────────────────┘

Selecciona:
✅ Production
✅ Preview
✅ Development
```
Click **"Add"**

---

#### Variable 2 de 6:
```
Key: ADMIN_USER
Value: admin

✅ Production ✅ Preview ✅ Development
```
Click **"Add"**

---

#### Variable 3 de 6:
```
Key: ADMIN_PASSWORD
Value: KejQf$^Pt*s31RJr2jbT

✅ Production ✅ Preview ✅ Development
```
Click **"Add"**

---

#### Variable 4 de 6:
```
Key: NEXTAUTH_SECRET
Value: 8UkjgZm1puNHLkc+V5m2Daji3eGnaRty8sxFWXe5gno=

✅ Production ✅ Preview ✅ Development
```
Click **"Add"**

---

#### Variable 5 de 6:
```
Key: CRON_SECRET
Value: BsBAcBhESxRkfBverSensh2h6A54BQdQ

✅ Production ✅ Preview ✅ Development
```
Click **"Add"**

---

#### Variable 6 de 6:
```
Key: NEXT_PUBLIC_BASE_URL
Value: https://gestor-afiliados.vercel.app

✅ Production ✅ Preview ✅ Development
```
Click **"Add"**

---

### PASO 5: Crear Base de Datos PostgreSQL

Esto es **MUY IMPORTANTE**:

1. En la misma pantalla, busca la sección **"Storage"** o **"Add-ons"**
2. Click en **"Create Database"**
3. Selecciona **"Postgres"**
4. Configuración:
   ```
   Database Name: gestor-afiliados (o deja por defecto)
   Region: Europe West 1 (fra1) - Amsterdam
   ```
5. Click **"Create"**

Vercel añadirá automáticamente estas variables:
- POSTGRES_URL
- POSTGRES_PRISMA_URL
- POSTGRES_URL_NON_POOLING
- POSTGRES_USER
- POSTGRES_HOST
- POSTGRES_PASSWORD
- POSTGRES_DATABASE

📝 **No necesitas copiarlas manualmente**

---

### PASO 6: ¡DEPLOY!

1. Verifica que tienes:
   - ✅ 6 variables de entorno configuradas
   - ✅ PostgreSQL database creada
   
2. **Scroll hasta arriba**
3. Click en el botón grande azul **"Deploy"**

Verás una pantalla con:
```
🚀 Deploying...
Building...
```

**Tiempo estimado: 2-3 minutos**

---

### PASO 7: ¡ÉXITO! 🎉

Cuando termine, verás:
```
✅ Deployment successful!
View Deployment: [URL aquí]
```

Tu URL será algo como:
```
https://gestor-afiliados-abc123xyz.vercel.app
```

---

### PASO 8: Actualizar URL Base (Importante)

1. **Copia tu URL de Vercel** (ej: https://gestor-afiliados-abc123.vercel.app)
2. Ve a: **Settings** (en el menú lateral)
3. Click en **"Environment Variables"**
4. Busca `NEXT_PUBLIC_BASE_URL`
5. Click en los **3 puntos** → **"Edit"**
6. Pega tu URL real
7. Click **"Save"**
8. Ve a **"Deployments"** → Click en **"Redeploy"**

---

### PASO 9: Ejecutar Migraciones de Base de Datos

Esto es necesario para crear las tablas en PostgreSQL:

**Opción A - Desde tu terminal local:**
```bash
# Copia la variable POSTGRES_URL desde Vercel
# Settings > Environment Variables > POSTGRES_URL > Copy

# En tu terminal:
set "DATABASE_URL=postgresql://..."  # Windows
npx prisma db push
```

**Opción B - Automático (más fácil):**
Ya está configurado en `package.json` con `postinstall`, así que se ejecutará automáticamente en el próximo redeploy.

---

### PASO 10: ¡PROBAR!

#### 10.1 Login:
```
URL: https://tu-app.vercel.app/login

Usuario: admin
Password: KejQf$^Pt*s31RJr2jbT
```

#### 10.2 Dashboard:
```
URL: https://tu-app.vercel.app/dashboard
```
Debe estar protegido y funcionar.

#### 10.3 Crear primera campaña:
1. Ve a la home: https://tu-app.vercel.app
2. Pega una URL de Amazon
3. Click "Auto-fill"
4. Prueba "Vision AI"
5. Genera contenido
6. Guarda

#### 10.4 Test del Cron (opcional):
```bash
curl "https://tu-app.vercel.app/api/cron/auto-post?key=BsBAcBhESxRkfBverSensh2h6A54BQdQ"
```

Deberías recibir:
```json
{
  "success": true,
  "created": "draft-...",
  "trend": "...",
  "category": "..."
}
```

---

## 🐛 SI ALGO FALLA

### Error: "Database connection failed"
```bash
# Ve a Vercel > Settings > Environment Variables
# Verifica que existen las variables POSTGRES_*
# Si no, vuelve a crear la database
```

### Error: "External API error occurred"
```
# Tu API de Gemini está agotada
# Espera 1 minuto y vuelve a intentar
# O verifica que NEXT_PUBLIC_GEMINI_API_KEY está bien configurada
```

### Error: "Unauthorized" en /dashboard
```
# Limpia cookies del navegador
# Vuelve a /login
```

### Build falla
```
# Ve a Vercel > Deployments > [Latest] > Logs
# Busca el error específico
# Probablemente es un problema de imports o TypeScript
```

---

## 📊 VERIFICACIÓN FINAL

Marca cuando completes cada paso:

- [ ] Variables de entorno configuradas (6)
- [ ] PostgreSQL database creada
- [ ] Primer deploy exitoso
- [ ] URL base actualizada
- [ ] Segundo deploy (redeploy) completado
- [ ] Login funciona
- [ ] Dashboard protegido
- [ ] Primera campaña creada
- [ ] Sitemap visible en /sitemap.xml
- [ ] Cron job probado manualmente

---

## 🎯 SIGUIENTES PASOS

### Hoy:
1. Configurar dominio personalizado (opcional)
2. Añadir sitemap a Google Search Console
3. Crear 2-3 campañas de prueba

### Esta semana:
1. Monitorear logs en Vercel
2. Probar todas las features
3. Ajustar prompts de IA si es necesario

---

## 📞 ¿NECESITAS AYUDA?

Si encuentras algún error:
1. Copia el mensaje de error completo
2. Ve a Vercel > Deployments > [Failed] > Logs
3. Busca la línea roja con el error
4. Comparte el error conmigo

---

**🎉 ¡FELICIDADES!**

Una vez que veas tu app en:
```
https://tu-app.vercel.app
```

¡Habrás completado el deploy!

---

**Tiempo total estimado:** 10-15 minutos  
**Nivel de dificultad:** ⭐⭐☆☆☆ (Fácil)

---

**Archivo de referencia:**
Todas las variables están en: `VERCEL-ENV-VARS.txt`

**Última actualización:** 2025-12-07 00:00
