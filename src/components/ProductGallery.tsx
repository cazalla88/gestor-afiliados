"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./ProductGallery.module.css";

interface ProductGalleryProps {
    mainImage: string;
    productName: string;
    score?: string;
    badgeLabel?: string;
    galleryImages?: string[];
}

export default function ProductGallery({ mainImage, productName, score = "9.5", badgeLabel = "EXCELENTE", galleryImages = [] }: ProductGalleryProps) {
    // DEBUG: Only use real images. Stop duplicating for now to diagnose.
    // SAFETY CHECK: Ensure we deal with valid URLs only
    const safeMainImage = (mainImage && (mainImage.startsWith('http') || mainImage.startsWith('/')))
        ? mainImage
        : "https://placehold.co/600x600/222/FFF?text=No+Image";

    let images = [safeMainImage];

    if (galleryImages.length > 0) {
        // Filter out EXACT duplicates and invalid URLs
        const uniqueGallery = galleryImages.filter(img => img && img !== safeMainImage && (img.startsWith('http') || img.startsWith('/')));
        images = [safeMainImage, ...uniqueGallery];
    }

    // FRONTEND FALLBACK: Force fill with duplicates of SAFE image
    if (images.length < 4) {
        let fillCount = 1;
        while (images.length < 4) {
            const separator = safeMainImage.includes('?') ? '&' : '?';
            images.push(`${safeMainImage}${separator}fe_fill=${fillCount}`);
            fillCount++;
        }
    }

    // Limit to 4
    images = images.slice(0, 4);

    const [selectedIndex, setSelectedIndex] = useState(0);

    // Auto-rotate every 10 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setSelectedIndex((prev) => (prev + 1) % images.length);
        }, 10000);

        return () => clearInterval(timer);
    }, [images.length]);

    return (
        <div className={styles.galleryContainer}>
            {/* Thumbnails Sidebar */}
            <div className={styles.thumbnailsList}>
                {images.map((img, idx) => (
                    <button
                        key={idx}
                        className={`${styles.thumbnailBtn} ${selectedIndex === idx ? styles.active : ''}`}
                        onClick={() => setSelectedIndex(idx)}
                        aria-label={`View image ${idx + 1}`}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={`Thumbnail ${idx}`} className={styles.thumbImg} />
                    </button>
                ))}
            </div>

            {/* Main Image Stage */}
            <div className={styles.mainStage}>
                <Image
                    src={images[selectedIndex] || safeMainImage}
                    alt={productName}
                    fill
                    className={styles.mainImage}
                    style={{ objectFit: "contain" }}
                    priority
                    unoptimized // Bypass Next.js optimization to prevent crashes with external URLs
                />

                {/* Score Badge Overlay */}
                <div className={styles.heroBadge}>
                    <span className={styles.badgeScore}>{score}</span>
                    <span className={styles.badgeLabel}>{badgeLabel}</span>
                </div>
            </div>
        </div>
    );
}
