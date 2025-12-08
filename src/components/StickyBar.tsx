"use client";

import { useState, useEffect } from 'react';
import styles from './StickyBar.module.css';

interface StickyBarProps {
    title: string;
    price: string;
    rating: string;
    affiliateLink: string;
    imageUrl?: string;
    lang: 'es' | 'en';
}

export default function StickyBar({ title, price, rating, affiliateLink, imageUrl, lang }: StickyBarProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show after scrolling 500px down
            if (window.scrollY > 500) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!isVisible) return null;

    return (
        <div className={styles.stickyBar}>
            <div className={`container ${styles.barContent}`}>
                <div className={styles.productInfo}>
                    {imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt="mini" className={styles.miniImg} />
                    )}
                    <div className={styles.textStack}>
                        <div className={styles.title}>{title}</div>
                        <div className={styles.meta}>
                            <span className={styles.rating}>⭐ {rating}/10</span>
                            {price && <span className={styles.price}>{price.replace(/\$/g, '€')}</span>}
                        </div>
                    </div>
                </div>
                <a
                    href={affiliateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.buyButton}
                >
                    {lang === 'es' ? 'Ver Oferta' : 'Check Price'}
                </a>
            </div>
        </div>
    );
}
