import Link from "next/link";
import Image from "next/image";
import styles from "./RelatedProducts.module.css";
import { getCategoryName, getCategoryIcon } from "@/lib/categories";

interface RelatedProduct {
    slug: string;
    productName: string;
    imageUrl: string | null;
    category: string;
}

interface RelatedProductsProps {
    currentSlug: string;
    category: string;
    products: RelatedProduct[];
    language?: 'en' | 'es';
}

export default function RelatedProducts({ currentSlug, category, products, language = 'en' }: RelatedProductsProps) {
    // Filter out current product and limit to 4
    const related = products.filter(p => p.slug !== currentSlug).slice(0, 4);

    if (related.length === 0) {
        return null;
    }

    const categoryName = getCategoryName(category, language);
    const categoryIcon = getCategoryIcon(category);

    return (
        <section className={styles.relatedSection}>
            <div className="container">
                <h2 className={styles.title}>
                    {categoryIcon} More from {categoryName}
                </h2>
                <div className={styles.grid}>
                    {related.map((product) => (
                        <Link
                            key={product.slug}
                            href={`/${category}/${product.slug}`}
                            className={styles.card}
                        >
                            <div className={styles.imageWrapper}>
                                <Image
                                    src={product.imageUrl || "https://placehold.co/300x200"}
                                    alt={product.productName}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    sizes="(max-width: 768px) 100vw, 300px"
                                />
                            </div>
                            <div className={styles.content}>
                                <h3>{product.productName}</h3>
                                <span className={styles.viewLink}>View Product →</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
