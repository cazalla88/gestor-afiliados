import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import styles from './categories.module.css';
import { getAllCampaigns } from '@/app/actions';

export default async function CategoriesPage() {
    const campaigns = await getAllCampaigns();

    // Count campaigns per category
    const categoryCounts = Object.keys(CATEGORIES).reduce((acc, key) => {
        acc[key] = campaigns.filter(c => c.category === key).length;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>📂 Categorías</h1>
                <p className={styles.subtitle}>Explora nuestro contenido organizado por temas</p>
            </header>

            <div className={styles.grid}>
                {Object.entries(CATEGORIES).map(([slug, category]) => (
                    <Link
                        key={slug}
                        href={`/categories/${slug}`}
                        className={styles.card}
                    >
                        <div className={styles.cardIcon}>{category.icon}</div>
                        <h3 className={styles.cardTitle}>{category.name.es}</h3>
                        <p className={styles.cardCount}>
                            {categoryCounts[slug] || 0} {categoryCounts[slug] === 1 ? 'artículo' : 'artículos'}
                        </p>
                        <div className={styles.cardArrow}>→</div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
