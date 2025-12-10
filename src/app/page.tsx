"use client";

import CreateCampaignForm from "@/components/CreateCampaignForm";
import LanguageSelector from "@/components/LanguageSelector";
import styles from "./page.module.css";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Content() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const editSlug = searchParams.get('edit');

  return (
    <div className={styles.mainContainer}>
      <header className={styles.navbar}>
        <div className={`container ${styles.navContainer}`}>
          <h1 className={styles.logo}>
            Affiliate<span className="text-gradient">Nexus</span>
          </h1>
          <div className={styles.navActions} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <a href="/dashboard" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>Dashboard</a>
            <LanguageSelector />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={`container ${styles.gridHelp}`}>
          <div className={styles.introSection}>
            <h2 className={styles.heroTitle}>
              {t.hero.titleLine1} <br />
              <span className="text-gradient">{t.hero.titleLine2}</span>
            </h2>
            <p className={styles.heroText}>
              {t.hero.subtitle}
            </p>


          </div>

          <div className={styles.formSection}>
            <CreateCampaignForm editSlug={editSlug || undefined} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Content />
    </Suspense>
  );
}
