"use client";

import CreateCampaignForm from "@/components/CreateCampaignForm";
import LanguageSelector from "@/components/LanguageSelector";
import styles from "./page.module.css";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";

function Content() {
  const { t } = useLanguage();

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

            <div className={styles.features}>
              <div className={styles.featureItem}>
                <span className={styles.icon}>🚀</span>
                <div>
                  <strong>{t.hero.faster}</strong>
                  <p>{t.hero.fasterDesc}</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.icon}>💎</span>
                <div>
                  <strong>{t.hero.premium}</strong>
                  <p>{t.hero.premiumDesc}</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.icon}>📈</span>
                <div>
                  <strong>{t.hero.seo}</strong>
                  <p>{t.hero.seoDesc}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <CreateCampaignForm />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return <Content />;
}
