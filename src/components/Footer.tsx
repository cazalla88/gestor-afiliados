"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
    const { t } = useLanguage();

    return (
        <footer style={{
            marginTop: 'auto',
            padding: '2rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.875rem',
            background: 'var(--background)'
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <p style={{ marginBottom: '0.5rem' }}>
                    {t.footer.disclaimer}
                </p>
                <p>
                    &copy; {new Date().getFullYear()} AffiliateNexus. {t.footer.rights}
                </p>
            </div>
        </footer>
    );
}
