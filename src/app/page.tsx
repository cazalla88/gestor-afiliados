import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { getHomePageData } from "@/app/actions"; // Server Action
import { CATEGORIES } from "@/lib/categories";
import styles from "./page.module.css";

// --- SERVER COMPONENT ---
export default async function Home() {
  const { hubs, latest } = await getHomePageData();

  return (
    <div style={{ backgroundColor: '#0f0f12', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif' }}>

      {/* 1. HEADER (Transparent) */}
      <header className="container" style={{ padding: '1rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.03em' }}>
          Affiliate<span style={{ background: 'linear-gradient(135deg, #db2777 0%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Nexus</span>
        </div>
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <a href="/dashboard" style={{ fontSize: '0.8rem', color: '#666', textDecoration: 'none', padding: '0.4rem 0.8rem', borderRadius: '50px', border: '1px solid #333', transition: 'all 0.2s' }}>
            Admin 🔐
          </a>
        </nav>
      </header>

      {/* 2. HERO SECTION COMPACTADO */}
      <section style={{ textAlign: 'center', padding: '3rem 1rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.8rem', fontWeight: '900', lineHeight: '1.2', marginBottom: '1rem', letterSpacing: '-0.02em', background: 'linear-gradient(to bottom, #fff 0%, #aaa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Tecnología y Estilo,<br />Decodificados.
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#888', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
          Reseñas expertas, comparativas reales y guías de compra completas para acertar siempre en tus decisiones.
        </p>

        {/* Search Bar */}
        <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto' }}>
          <input
            type="text"
            placeholder="Busca reseñas (ej. 'monitores 4k')..."
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              borderRadius: '50px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontSize: '1rem',
              outline: 'none',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
          />
          <button style={{ position: 'absolute', right: '6px', top: '6px', bottom: '6px', padding: '0 1.2rem', borderRadius: '50px', background: '#333', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
            Buscar
          </button>
        </div>
      </section>

      {/* 3. CATEGORIES BENTO GRID (Ahora más arriba) */}
      <section className="container" style={{ maxWidth: '1200px', margin: '0 auto 6rem', padding: '0 1rem' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '20px', height: '4px', background: '#db2777', borderRadius: '2px', display: 'block' }}></span>
          Explora por Categorías
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {Object.entries(CATEGORIES).map(([slug, cat]) => (
            <Link key={slug} href={`/categories/${slug}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'linear-gradient(180deg, rgba(30,30,35,0.6) 0%, rgba(20,20,25,0.9) 100%)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '1.2rem',
                height: '100%',
                transition: 'transform 0.2s',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '130px'
              }}>
                <span style={{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>{(cat as any).icon}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>{(cat as any).name.es || (cat as any).name.en}</h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#666' }}>Guías y Análisis</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. FEATURED HUBS (GOLDEN CLUSTERS) */}
      {hubs.length > 0 && (
        <section style={{ backgroundColor: '#16161a', padding: '5rem 0' }}>
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '3rem' }}>
              <div>
                <span style={{ color: '#7c3aed', fontWeight: 'bold', letterSpacing: '0.1em', fontSize: '0.8rem', textTransform: 'uppercase' }}>Guías Expertas</span>
                <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem', marginBottom: 0 }}>Hubs Destacados</h2>
              </div>
              <Link href="/categories/tech" style={{ color: '#888', textDecoration: 'none', borderBottom: '1px solid #444' }}>Ver Todas &rarr;</Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem' }}>
              {hubs.map((hub) => (
                <Link key={hub.slug} href={`/${hub.category}/${hub.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    position: 'relative',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    aspectRatio: '16/9',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <Image
                      src={hub.imageUrl || 'https://placehold.co/800x600/1a1a1a/FFF'}
                      alt={hub.title}
                      fill
                      style={{ objectFit: 'cover', transition: 'transform 0.5s' }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
                      padding: '2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end'
                    }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: '#7c3aed',
                        color: 'white',
                        borderRadius: '50px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        alignSelf: 'flex-start',
                        marginBottom: '1rem'
                      }}>
                        MASTER HUB
                      </span>
                      <h3 style={{ fontSize: '2rem', color: 'white', margin: '0 0 0.5rem 0', fontWeight: '800' }}>{hub.title}</h3>
                      <p style={{ color: '#ccc', fontSize: '1rem', maxWidth: '80%' }}>{hub.description.substring(0, 100)}...</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. LATEST REVIEWS */}
      <section className="container" style={{ maxWidth: '1200px', margin: '6rem auto', padding: '0 1rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Recién salido del Horno</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {latest.map((post) => (
            <Link key={post.slug} href={`/${post.category}/${post.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '4/3', marginBottom: '1rem' }}>
                  <Image
                    src={post.imageUrl || 'https://placehold.co/600x400'}
                    alt={post.productName}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                  {post.type === 'landing' && (
                    <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>
                      OFERTA
                    </span>
                  )}
                </div>
                <span style={{ color: '#db2777', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  {(CATEGORIES[post.category as keyof typeof CATEGORIES] as any)?.name?.es || (CATEGORIES[post.category as keyof typeof CATEGORIES] as any)?.name?.en || post.category}
                </span>
                <h3 style={{ fontSize: '1.25rem', color: 'white', margin: '0 0 0.5rem 0', fontWeight: '700', lineHeight: '1.3' }}>
                  {post.title || post.productName}
                </h3>
                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #222', display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.85rem' }}>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  <span>Leer Review &rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer style={{ borderTop: '1px solid #222', padding: '4rem 1rem', marginTop: '4rem', color: '#666', fontSize: '0.9rem' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ marginBottom: '2rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff' }}>AffiliateNexus</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem' }}>
            <Link href="/categories/tech" style={{ color: '#888', textDecoration: 'none' }}>Tecnología</Link>
            <Link href="/categories/home" style={{ color: '#888', textDecoration: 'none' }}>Hogar</Link>
            <Link href="/privacy-policy" style={{ color: '#888', textDecoration: 'none' }}>Política de Privacidad</Link>
            <Link href="/dashboard" style={{ color: '#888', textDecoration: 'none' }}>Acceso Admin</Link>
          </div>
          <p>
            En calidad de Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables.
            <br />
            &copy; {new Date().getFullYear()} AffiliateNexus. Todos los derechos reservados.
          </p>
        </div>
      </footer>

    </div>
  );
}
