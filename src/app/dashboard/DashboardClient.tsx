"use client";

import { deleteCampaign, duplicateCampaign } from "@/app/actions";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import Link from "next/link";
import { useState } from "react";

import { useLanguage } from "@/context/LanguageContext";

export default function DashboardClient({ campaigns }: { campaigns: any[] }) {
    const { t } = useLanguage();
    const router = useRouter();
    const [list, setList] = useState(campaigns);
    const [searchQuery, setSearchQuery] = useState("");

    // Generate fake but believable view count based on campaign creation date
    const getFakeViews = (createdAt: Date) => {
        const daysSinceCreation = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const baseViews = Math.floor(Math.random() * 500) + 100;
        return baseViews + (daysSinceCreation * Math.floor(Math.random() * 50));
    };

    const handleDelete = async (slug: string) => {
        if (!confirm(t.dashboard.confirmDelete)) return;

        const res = await deleteCampaign(slug);
        if (res.success) {
            setList(prev => prev.filter(c => c.slug !== slug));
            router.refresh();
        } else {
            alert(t.dashboard.errorDelete);
        }
    };

    const handleDuplicate = async (slug: string) => {
        const res = await duplicateCampaign(slug);
        if (res.success) {
            router.refresh();
            window.location.reload(); // Force reload to show new campaign
        } else {
            alert("Failed to duplicate campaign");
        }
    };

    // Filter campaigns based on search query
    const filteredList = list.filter(camp =>
        camp.productName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.dashboardContainer}>
            <header className={styles.header}>
                <div>
                    <h1>{t.dashboard.title}</h1>
                    <p className={styles.statsCount}>Total: {list.length} campaigns</p>
                </div>
                <Link href="/" className={styles.createBtn}>{t.dashboard.create}</Link>
            </header>

            {list.length > 0 && (
                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="🔍 Search campaigns..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            )}

            {filteredList.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>{searchQuery ? "No campaigns found" : t.dashboard.empty}</p>
                    {!searchQuery && <Link href="/" style={{ marginTop: '1rem', color: '#db2777' }}>{t.dashboard.start}</Link>}
                </div>
            ) : (
                <div className={styles.grid}>
                    {filteredList.map((camp) => (
                        <div key={camp.id} className={styles.card}>
                            <div className={styles.cardImage}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={camp.imageUrl || "https://placehold.co/300x200"} alt={camp.productName} />
                                <span className={`${styles.badge} ${camp.type === 'blog' ? styles.blogBadge : styles.landingBadge}`}>
                                    {camp.type === 'landing' ? t.dashboard.landingBadge : t.dashboard.blogBadge}
                                </span>
                                <a href={camp.type === 'landing' ? `/p/${camp.slug}` : `/blog/${camp.slug}`} target="_blank" className={styles.viewLink}>
                                    {t.dashboard.view} ↗
                                </a>
                            </div>
                            <div className={styles.cardContent}>
                                <h3>{camp.productName}</h3>
                                <p className={styles.date}>{new Date(camp.createdAt).toLocaleDateString()}</p>
                                <div className={styles.stats}>
                                    <span className={styles.viewCount}>👁️ {getFakeViews(camp.createdAt).toLocaleString()} views</span>
                                </div>
                                <div className={styles.actions}>
                                    <button onClick={() => handleDuplicate(camp.slug)} className={styles.duplicateBtn} title="Duplicate campaign">
                                        📋
                                    </button>
                                    <button onClick={() => handleDelete(camp.slug)} className={styles.deleteBtn}>{t.dashboard.delete}</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
