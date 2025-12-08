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
    // Ensure mainImage is always first
    let images = [mainImage];
    if (galleryImages.length > 0) {
        images = [mainImage, ...galleryImages.filter(img => img !== mainImage)];
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
                    src={images[selectedIndex] || mainImage}
                    alt={productName}
                    fill
                    className={styles.mainImage}
                    style={{ objectFit: "contain" }}
                    priority
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
