# 🎯 AffiliateNexus - Documentación de Configuración

## ✅ Funcionalidades Implementadas

### 1. 🔒 Autenticación (NextAuth)
- **Ubicación**: `/login`
- **Protección**: Todo el `/dashboard` requiere autenticación
- **Credenciales por defecto**:
  - Usuario: `admin`
  - Contraseña: `admin123`

**⚠️ IMPORTANTE**: Cambiar credenciales en producción:
```env
# Añadir a .env
ADMIN_USER=tu_usuario
ADMIN_PASSWORD=tu_contraseña_segura
NEXTAUTH_SECRET=genera_un_secret_aleatorio_aqui
```

### 2. 🖼️ CDN Local de Imágenes
- Las imágenes de Amazon se descargan automáticamente a `public/uploads/`
- Ya no dependes de URLs externas que pueden romperse
- Las imágenes persisten en tu servidor

### 3. 🤖 Auto-Pilot (Generación Automática)
- **Endpoint**: `GET /api/cron/auto-post?key=cron123`
- **Funcionamiento**:
  1. Analiza tendencias en categorías aleatorias
  2. Genera contenido SEO completo con IA
  3. Guarda un borrador en la base de datos
  4. El título incluye `[DRAFT]` para identificarlo

**Configuración para Producción**:
```env
CRON_SECRET=tu_clave_secreta_aqui
```

**Automatización con Vercel Cron**:
1. Ve a tu proyecto en Vercel
2. Settings > Cron Jobs
3. Añade:
   - Pattern: `0 9 * * 1` (Lunes a las 9 AM)
   - URL: `/api/cron/auto-post?key=tu_clave_secreta`

### 4. 👁️ Vision AI
- Botón "👁️ Analyze Image" en el formulario
- La IA describe automáticamente las imágenes del producto
- Genera descripciones optimizadas para SEO

### 5. 🔗 SEO Auto-Linking
- La IA crea enlaces internos automáticamente
- Analiza tus campañas existentes
- Genera enlaces contextuales relevantes
- Se muestran en sección "📚 Te puede interesar"

### 6. ⚔️ Battle Mode
- Compara 2 productos automáticamente
- Genera artículos "X vs Y"
- Alto potencial de conversión
- Keywords de búsqueda populares

### 7. 🔮 Trend Hunter
- Analiza tendencias de mercado 2025/2026
- Valida con datos reales de Google Trends
- Muestra crecimiento/decrecimiento
- Sugiere productos específicos

## 🚀 Variables de Entorno Necesarias

Crea/actualiza tu archivo `.env` con:

```env
# Base de Datos (Vercel Postgres o similar)
POSTGRES_PRISMA_URL="postgresql://..."
POSTGRES_URL_NON_POOLING="postgresql://..."

# Gemini AI (Obligatorio)
NEXT_PUBLIC_GEMINI_API_KEY="tu_api_key_de_google_ai_studio"
# O alternativamente:
GOOGLE_API_KEY="tu_api_key"

# Autenticación
ADMIN_USER="admin"
ADMIN_PASSWORD="cambiar_en_produccion"
NEXTAUTH_SECRET="genera_un_string_aleatorio_largo"

# Cron Job
CRON_SECRET="otra_clave_secreta_aleatoria"

# URL Base (Producción)
NEXT_PUBLIC_BASE_URL="https://tu-dominio.com"
```

## 📋 Comandos Esenciales

```bash
# Desarrollo
npm run dev

# Construir para producción
npm run build

# Actualizar base de datos
npx prisma generate
npx prisma db push

# Ver base de datos
npx prisma studio
```

## 🛠️ Flujo de Trabajo Recomendado

### Crear Campaña Manual
1. Ve a http://localhost:3000
2. Pega URL de Amazon → Auto-relleno
3. Presiona "👁️ Analyze Image" si quieres descripción AI
4. Click "🚀 Optimize with AI"
5. Revisa preview
6. Guarda

### Crear Campaña Auto (Cron)
1. Configurar variables de entorno
2. En Vercel: Setup Cron Job
3. O manualmente: `curl http://localhost:3000/api/cron/auto-post?key=cron123`
4. Revisar borradores en Dashboard
5. Editar y completar datos faltantes

### Crear Batalla (Comparativa)
1. Dashboard → ⚔️ Battle Mode
2. Seleccionar 2 productos
3. START BATTLE
4. La IA genera comparativa completa

## 🐛 Problemas Conocidos y Soluciones

### Error: "API Key Missing"
**Solución**: Asegúrate de que `NEXT_PUBLIC_GEMINI_API_KEY` está en `.env`

### Error: NextAuth callback
**Solución**: Añade `NEXTAUTH_SECRET` a `.env`

### Imágenes no se descargan
**Verificar**: 
- Carpeta `public/uploads/` tiene permisos de escritura
- URL de imagen es accesible públicamente

### Trend Hunter no funciona
**Causas comunes**:
- Rate limit de Google AI (espera 1 minuto)
- Google Trends API bloqueada (normal, se degrada gracefully)

## 🎨 Personalización

### Cambiar Categorías
Edita: `src/lib/categories.ts`

### Cambiar Templates
- Landing: `src/components/templates/LandingTemplate.tsx`
- Blog: `src/components/templates/BlogTemplate.tsx`

### Cambiar Prompts de IA
Edita: `src/app/actions.ts`
- `generateSeoContent` (línea ~70)
- `generateBattleContent` (línea ~200)
- `analyzeTrends` (línea ~440)

## 📊 Base de Datos

La base de datos PostgreSQL incluye:
- **slug**: ID único de la campaña
- **type**: 'landing' o 'blog'
- **category**: Para SEO silos
- **language**: 'en' o 'es'
- **content**: JSON con estructura completa
  - introduction
  - targetAudience
  - quantitativeAnalysis
  - features
  - pros/cons
  - comparisonTable
  - verdict
  - **internalLinks** ← Nuevo campo

## 🔐 Seguridad en Producción

1. **Cambiar todas las contraseñas por defecto**
2. **Usar HTTPS** (automático en Vercel)
3. **Rate limiting** en `/api/cron/*` (recomendado)
4. **Validar inputs** del usuario (ya implementado básico)
5. **Backup regular** de la base de datos

## 📈 Optimizaciones SEO

✅ Sitemap dinámico (`/sitemap.xml`)
✅ Canonical URLs
✅ OpenGraph tags
✅ Twitter Cards
✅ Internal linking automático
✅ Structured data (JSON-LD)
✅ Image optimization con Next.js

## 🎯 Próximos Pasos Sugeridos

1. **Analytics**: Integrar Google Analytics 4
2. **A/B Testing**: Probar diferentes CTAs
3. **Email Capture**: Newsletter para remarketing
4. **Más Templates**: Crear variaciones de diseño
5. **Multi-idioma avanzado**: Contenido duplicado por idioma

---

**⚡ Creado con Antigravity AI**
**📅 Última actualización**: Diciembre 2025
