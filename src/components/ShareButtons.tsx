"use client";

import styles from "./ShareButtons.module.css";

interface ShareButtonsProps {
    url: string;
    title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    const shareLinks = {
        twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    };

    return (
        <div className={styles.shareContainer}>
            <span className={styles.shareLabel}>Share:</span>
            <div className={styles.shareButtons}>
                <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className={styles.shareBtn} title="Share on Twitter">
                    𝕏
                </a>
                <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className={styles.shareBtn} title="Share on Facebook">
                    f
                </a>
                <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className={styles.shareBtn} title="Share on LinkedIn">
                    in
                </a>
                <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className={styles.shareBtn} title="Share on WhatsApp">
                    ⟨⟩
                </a>
            </div>
        </div>
    );
}
