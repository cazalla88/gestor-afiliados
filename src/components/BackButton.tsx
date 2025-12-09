"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function BackButton({ className }: { className?: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [fromDashboard, setFromDashboard] = useState(false);

    useEffect(() => {
        // Simple check: if document.referrer includes 'dashboard', we came from there.
        if (typeof window !== 'undefined' && document.referrer.includes('/dashboard')) {
            setFromDashboard(true);
        }
    }, []);

    // If query param ?source=dashboard is present (we can add this to dashboard links later)
    // Or if detected via referrer
    if (fromDashboard || searchParams.get('source') === 'dashboard') {
        return (
            <button
                onClick={() => router.push('/dashboard')}
                className={className}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', color: 'inherit' }}
            >
                ← Volver al Dashboard
            </button>
        );
    }

    // Default fallback
    return (
        <Link href="/categories" className={className}>
            ← Volver a categorías
        </Link>
    );
}
