import { getAllCampaigns } from '@/app/actions';
import { CATEGORIES, getCategoryName, getCategoryIcon } from '@/lib/categories';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import styles from './category.module.css';

export async function generateStaticParams() {
    return Object.keys(CATEGORIES).map((slug) => ({
        slug,
    }));
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Validate category
    if (!(slug in CATEGORIES)) {
        notFound();
    }

    const allCampaigns = await getAllCampaigns();
    const campaigns = allCampaigns.filter((c) => c.category === slug);

    const categoryName = getCategoryName(slug, 'es');
    const categoryIcon = getCategoryIcon(slug);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/categories" className={styles.backButton}>
                    ← Volver a categorías
                </Link>

                <div className={styles.categoryTitle}>
                    <span className={styles.categoryIcon}>{categoryIcon}</span>
                    <h1>{categoryName}</h1>
                </div>

                <p className={styles.count}>
                    {campaigns.length} {campaigns.length === 1 ? 'artículo' : 'artículos'}
                </p>
            </header>

            {campaigns.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>📭</div>
                    <h2>No hay artículos aún</h2>
                    <p>Esta categoría aún no tiene contenido.</p>
                    <Link href="/dashboard" className={styles.createButton}>
                        + Crear nueva campaña
                    </Link>
                </div>
            ) : (
                <div className={styles.grid}>
                    {campaigns.map((campaign) => (
                        <Link
                            key={campaign.slug}
                            href={`/${campaign.category}/${campaign.slug}`}
                            className={styles.card}
                        >
                            {campaign.imageUrl && (
                                <div className={styles.imageWrapper}>
                                    <Image
                                        src={campaign.imageUrl}
                                        alt={campaign.productName}
                                        fill
                                        className={styles.image}
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                </div>
                            )}

                            <div className={styles.content}>
                                <h3 className={styles.title}>{campaign.productName}</h3>

                                <div className={styles.meta}>
                                    <span className={styles.type}>
                                        {campaign.type === 'blog' ? '📝 Review' : '🎯 Landing'}
                                    </span>
                                    <span className={styles.date}>
                                        {new Date(campaign.createdAt).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
