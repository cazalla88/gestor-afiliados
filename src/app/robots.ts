import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://gestor-afiliados-web.vercel.app';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/dashboard/', '/api/'], // Protect internal routes
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
