'use client'; // Error components must be Client Components

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div style={{
            padding: '4rem',
            textAlign: 'center',
            fontFamily: 'sans-serif',
            background: '#111',
            color: '#fff',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <h2 style={{ color: '#ef4444', fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong! 💥</h2>
            <p style={{ color: '#ccc', marginBottom: '2rem', maxWidth: '600px' }}>
                {error.message || "Unknown server error occurred."}
            </p>

            {error.digest && (
                <p style={{ fontFamily: 'monospace', background: '#333', padding: '0.5rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                    Digest: {error.digest}
                </p>
            )}

            <button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
                style={{
                    background: '#fff',
                    color: '#000',
                    border: 'none',
                    padding: '0.8rem 2rem',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    borderRadius: '99px',
                    cursor: 'pointer',
                    marginTop: '2rem'
                }}
            >
                Try again
            </button>
        </div>
    );
}
