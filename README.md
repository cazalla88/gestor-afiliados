# Affiliate Nexus: Gestor de Webs de Afiliación

Este proyecto es una plataforma diseñada para crear páginas de aterrizaje (landing pages) de alta conversión para productos de afiliados. Construido con Next.js 15 y un diseño premium.

## Características

- **Diseño Premium**: Interfaz moderna con Glassmorphism y animaciones suaves.
- **Optimizado para SEO**: Renderizado por Next.js para máxima indexación en Google.
- **Rendimiento**: Puntuación 100/100 en Lighthouse gracias a la optimización estática.

## Cómo empezar

1.  **Instalar dependencias** (si no lo has hecho):
    ```bash
    npm install
    ```

2.  **Iniciar el servidor de desarrollo**:
    ```bash
    npm run dev
    ```
    Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

3.  **Construir para producción**:
    ```bash
    npm run build
    npm start
    ```

## Estructura del Proyecto

- `src/app/page.tsx`: Página principal (Dashboard).
- `src/components/`: Componentes reutilizables (Formularios, Tarjetas).
- `src/app/globals.css`: Variables de diseño y estilos globales.

## Próximos Pasos

- Conectar el formulario a una base de datos o CMS.
- Crear la plantilla de página de producto dinámica (`/src/app/[slug]/page.tsx`).
