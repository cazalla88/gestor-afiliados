"use client";

import { useLanguage } from "@/context/LanguageContext";
import styles from "./LanguageSelector.module.css";

export default function LanguageSelector() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className={styles.selector}>
            <button
                className={`${styles.option} ${language === 'en' ? styles.active : ''}`}
                onClick={() => setLanguage('en')}
            >
                🇺🇸 EN
            </button>
            <div className={styles.divider}></div>
            <button
                className={`${styles.option} ${language === 'es' ? styles.active : ''}`}
                onClick={() => setLanguage('es')}
            >
                🇪🇸 ES
            </button>
        </div>
    );
}
