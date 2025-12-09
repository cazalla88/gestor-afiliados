"use client";

import { useState, useEffect, useRef } from "react";
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
    images = images.slice(0, 4);

    const [selectedIndex, setSelectedIndex] = useState(0);

    const [localInputValue, setLocalInputValue] = useState("");

    // Auto-rotate every 10 seconds (only if not editing)
    useEffect(() => {
        if (isEditable) return;
        const timer = setInterval(() => {
            setSelectedIndex((prev) => (prev + 1) % images.length);
        }, 10000);

        return () => clearInterval(timer);
    }, [images.length, isEditable]);

    // Sync local state when selected image changes
    useEffect(() => {
        let val = "";
        if (selectedIndex === 0) {
            val = mainImage || "";
        } else {
            const galIdx = selectedIndex - 1;
            val = galleryImages[galIdx] || "";
        }
        // Don't show placeholders in the edit box, only real data
        if (val.includes("placehold.co")) val = "";

        setLocalInputValue(val);
    }, [selectedIndex, mainImage, galleryImages]);

    const handleDrop = (e: React.DragEvent, index: number) => {
        if (!isEditable || !onImageUpdate) return;
        e.preventDefault();
        e.stopPropagation();

        let imageUrl = "";

        // 1. Try to get direct URL list (standard)
        const uriList = e.dataTransfer.getData("text/uri-list");
        if (uriList) {
            imageUrl = uriList.split('\n')[0].trim();
        }

        // 2. If empty, try "text/html" (common when dragging <img> tags)
        if (!imageUrl) {
            const html = e.dataTransfer.getData("text/html");
            if (html) {
                // Extract src="..." from the HTML string
                const srcMatch = html.match(/src="([^"]+)"/);
                if (srcMatch && srcMatch[1]) {
                    imageUrl = srcMatch[1];
                }
            }
        }

        // 3. Fallback to plain text
        if (!imageUrl) {
            imageUrl = e.dataTransfer.getData("text/plain");
        }

        // 4. Validate and Update
        // Fix encoded google images or weird proxies
        if (imageUrl && (imageUrl.startsWith("http") || imageUrl.startsWith("data:image"))) {
            // Removing quotes if any
            imageUrl = imageUrl.replace(/"/g, '');

            console.log("Image Dropped:", imageUrl); // Debug
            onImageUpdate(index, imageUrl);
            setSelectedIndex(index);
        } else {
            console.log("Drop failed, data types:", e.dataTransfer.types);
            alert("Could not extract image URL. Try: Right Click Image -> Open in New Tab -> Drag URL from address bar.");
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (!isEditable) return;
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = "copy";
    };

    const handlePaste = async (index: number) => {
        if (!isEditable || !onImageUpdate) return;

        try {
            // Try to read generic text first
            const text = await navigator.clipboard.readText();
            if (text && text.startsWith('http')) {
                onImageUpdate(index, text);
                setSelectedIndex(index);
                return;
            }
        } catch (err) {
            // Clipboard API might be blocked or require permission
            console.warn("Clipboard read failed, falling back to prompt", err);
        }

        // Fallback for mouse users if API fails
        const manualUrl = prompt("Paste the image link here:");
        if (manualUrl && manualUrl.startsWith('http')) {
            onImageUpdate(index, manualUrl);
            setSelectedIndex(index);
        }
    };

    const mainStageRef = useRef<HTMLDivElement>(null);

    // Handle Ctrl+V event
    const handlePasteEvent = (e: React.ClipboardEvent, index: number) => {
        if (!isEditable || !onImageUpdate) return;

        // 1. Check for Text (URL)
        const text = e.clipboardData.getData('text');
        if (text && text.startsWith('http')) {
            e.preventDefault();
            onImageUpdate(index, text);
            setSelectedIndex(index);
            return;
        }

        // 2. Check if user copied "Image" instead of "Image Address"
        if (e.clipboardData.files.length > 0) {
            e.preventDefault();
            alert("⚠️ has copiado la 'Imagen' (Binario). Por favor, haz click derecho y elige 'Copiar Dirección de Imagen' (URL). La base de datos necesita enlaces.");
            return;
        }

        console.log("Paste ignored: No URL found");
    };

    // Force focus when clicking/interacting so Paste works
    const focusMain = () => {
        if (mainStageRef.current && isEditable) {
            mainStageRef.current.focus();
        }
    };

    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className={styles.galleryContainer}>
            {/* Thumbnails Sidebar */}
            <div className={styles.thumbnailsList}>
                {images.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                        <button
                            className={`${styles.thumbnailBtn} ${selectedIndex === idx ? styles.active : ''}`}
                            onClick={() => setSelectedIndex(idx)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, idx)}
                            onPaste={(e) => handlePasteEvent(e, idx)}
                            aria-label={`View image ${idx + 1}`}
                            style={isEditable ? { border: '2px dashed #444', cursor: 'pointer' } : {}}
                            title={isEditable ? "Click to Edit or Drag Image" : ""}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt={`Thumbnail ${idx}`} className={styles.thumbImg} />
                        </button>
                        {isEditable && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePaste(idx); }}
                                style={{
                                    position: 'absolute', top: -5, right: -5,
                                    background: '#2563eb', color: 'white', border: 'none',
                                    borderRadius: '50%', width: '20px', height: '20px',
                                    cursor: 'pointer', fontSize: '12px', zIndex: 10,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                title="Paste Image URL"
                            >
                                📋
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Main Image Stage */}
            <div
                ref={mainStageRef}
                className={styles.mainStage}
                onClick={focusMain}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onDragOver={(e) => { handleDragOver(e); focusMain(); }}
                onDrop={(e) => handleDrop(e, selectedIndex)}
                onPaste={(e) => handlePasteEvent(e, selectedIndex)}
                tabIndex={0} // Make focusable for paste
                style={isEditable ? {
                    outline: isFocused ? '3px solid #3b82f6' : '2px dashed rgba(255,255,255,0.2)', // Blue when focused
                    outlineOffset: isFocused ? '0px' : '-10px',
                    position: 'relative',
                    cursor: 'text',
                    transition: 'outline 0.1s ease'
                } : {}}
            >
                <Image
                    src={images[selectedIndex] || safeMainImage}
                    alt={productName}
                    fill
                    className={styles.mainImage}
                    style={{ objectFit: "contain" }}
                    priority
                    unoptimized
                />

                {/* Score Badge Overlay */}
                <div className={styles.heroBadge}>
                    <span className={styles.badgeScore}>{score}</span>
                    <span className={styles.badgeLabel}>{badgeLabel}</span>
                </div>

                {isEditable && (
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        background: 'rgba(0,0,0,0.9)', padding: '12px',
                        display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 100
                    }}>
                        <label style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>
                            ✏️ Edit Image {selectedIndex + 1} URL:
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                placeholder="Paste URL here..."
                                value={localInputValue}
                                onChange={(e) => {
                                    setLocalInputValue(e.target.value);
                                    onImageUpdate && onImageUpdate(selectedIndex, e.target.value);
                                }}
                                style={{
                                    flex: 1, padding: '8px', borderRadius: '4px',
                                    border: '1px solid #555', background: '#222',
                                    color: '#fff', fontSize: '1rem'
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onPaste={(e) => e.stopPropagation()} // Let default paste happen
                            />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLocalInputValue("");
                                    if (onImageUpdate) onImageUpdate(selectedIndex, "");
                                }}
                                style={{
                                    padding: '8px 12px', background: '#ef4444',
                                    color: 'white', border: 'none', borderRadius: '4px',
                                    cursor: 'pointer', fontWeight: 'bold'
                                }}
                                title="Clear"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

