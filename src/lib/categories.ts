// SEO Silo Categories Configuration
export const CATEGORIES = {
    fashion: { slug: 'fashion', name: { en: 'Fashion', es: 'Moda' }, icon: '👗' },
    tech: { slug: 'tech', name: { en: 'Technology', es: 'Tecnología' }, icon: '💻' },
    home: { slug: 'home', name: { en: 'Home & Garden', es: 'Hogar y Jardín' }, icon: '🏠' },
    sports: { slug: 'sports', name: { en: 'Sports & Outdoors', es: 'Deportes' }, icon: '⚽' },
    beauty: { slug: 'beauty', name: { en: 'Beauty & Health', es: 'Belleza y Salud' }, icon: '💄' },
    books: { slug: 'books', name: { en: 'Books & Media', es: 'Libros y Medios' }, icon: '📚' },
    toys: { slug: 'toys', name: { en: 'Toys & Games', es: 'Juguetes y Juegos' }, icon: '🎮' },
    general: { slug: 'general', name: { en: 'General', es: 'General' }, icon: '🏷️' },
} as const;

export type CategorySlug = keyof typeof CATEGORIES;

export function getCategoryName(slug: string, lang: 'en' | 'es' = 'en'): string {
    const category = CATEGORIES[slug as CategorySlug];
    return category ? category.name[lang] : slug;
}

export function getCategoryIcon(slug: string): string {
    const category = CATEGORIES[slug as CategorySlug];
    return category ? category.icon : '🏷️';
}
