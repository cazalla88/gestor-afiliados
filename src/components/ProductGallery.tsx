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
    isEditable?: boolean;
    onImageUpdate?: (index: number, newUrl: string) => void;
}

export default function ProductGallery({
    mainImage,
    productName,
    score = "9.5",
    badgeLabel = "EXCELENTE",
    galleryImages = [],
    isEditable = false,
    onImageUpdate
}: ProductGalleryProps) {
    // DEBUG: Only use real images. Stop duplicating for now to diagnose.
    // SAFETY CHECK: Ensure we deal with valid URLs only
    const safeMainImage = (mainImage && (mainImage.startsWith('http') || mainImage.startsWith('/')))
        ? mainImage
        : "https://placehold.co/600x600/222/FFF?text=No+Image";

    let images = [safeMainImage];

    if (galleryImages.length > 0) {
        // We use the raw galleryImages array because editing depends on indexes matching the source
        // Filter out empty strings but keep structure for editing
        images = [safeMainImage, ...galleryImages].slice(0, 4);
    }

    // Fill gaps cleanly for UI
    while (images.length < 4) {
        images.push("https://placehold.co/600x600/333/666?text=Drop+Image+Here");
    }

    const [selectedIndex, setSelectedIndex] = useState(0);

    // Auto-rotate every 10 seconds (only if not editing)
    useEffect(() => {
        if (isEditable) return;
        const timer = setInterval(() => {
            setSelectedIndex((prev) => (prev + 1) % images.length);
        }, 10000);

        return () => clearInterval(timer);
    }, [images.length, isEditable]);

    const handleDrop = (e: React.DragEvent, index: number) => {
        if (!isEditable || !onImageUpdate) return;
        e.preventDefault();
        e.stopPropagation();

        const data = e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("text/uri-list");
        if (data && (data.startsWith("http") || data.startsWith("data:image"))) {
            // Index 0 is mainImage, 1+ are galleryImages
            onImageUpdate(index, data);
            setSelectedIndex(index); // Focus on the dropped image
        } else {
            alert("No valid image URL found in drag. Try dragging an image from a Chrome tab.");
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (!isEditable) return;
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = "copy";
    };

    return (
        <div className={styles.galleryContainer}>
            {/* Thumbnails Sidebar */}
            <div className={styles.thumbnailsList}>
                {images.map((img, idx) => (
                    <button
                        key={idx}
                        className={`${styles.thumbnailBtn} ${selectedIndex === idx ? styles.active : ''}`}
                        onClick={() => setSelectedIndex(idx)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, idx)}
                        aria-label={`View image ${idx + 1}`}
                        style={isEditable ? { border: '2px dashed #444', cursor: 'copy' } : {}}
                        title={isEditable ? "Drag & Drop Image URL here to update" : ""}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={`Thumbnail ${idx}`} className={styles.thumbImg} />
                    </button>
                ))}
            </div>

            {/* Main Image Stage */}
            <div
                className={styles.mainStage}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, selectedIndex)}
                style={isEditable ? { outline: '2px dashed rgba(255,255,255,0.2)', outlineOffset: '-10px' } : {}}
            >
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

                {isEditable && (
                    <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '5px 10px', borderRadius: '5px', fontSize: '0.8rem', pointerEvents: 'none' }}>
                        ✍️ Drag Image Here
                    </div>
                )}
            </div>
        </div>
    );
}
