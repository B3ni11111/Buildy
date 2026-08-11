import { useEffect, useState } from 'react';
import { exchangeCodeForTokens, saveTokens } from '../utils/cognito';

export default function Callback() {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const errorParam = params.get('error');

        if (errorParam) {
          throw new Error(
            `Authorization failed: ${errorParam} - ${params.get('error_description') || ''}`
          );
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        const tokens = await exchangeCodeForTokens(code);
        saveTokens(tokens);

        window.location.href = '/';
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'An unexpected error occurred'
          );
          setIsProcessing(false);
        }
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isProcessing) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              margin: '0 auto 1.5rem',
              border: '4px solid rgba(255,255,255,0.3)',
              borderTopColor: 'white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>Processing sign-in...</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)' }}>
            Completing your login securely
          </p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          padding: '2.5rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          maxWidth: '420px',
        }}
      >
        <div
          style={{
            fontSize: '3rem',
            marginBottom: '1rem',
          }}
        >
          ⚠️
        </div>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#c53030',
            marginBottom: '0.5rem',
          }}
        >
          Sign-in Failed
        </h2>
        <p
          style={{
            color: '#718096',
            marginBottom: '2rem',
            fontSize: '0.95rem',
            lineHeight: 1.6,
          }}
        >
          {error}
        </p>
        <button
          onClick={() => (window.location.href = '/')}
          style={{
            width: '100%',
            padding: '0.875rem 1.5rem',
            fontSize: '0.95rem',
            backgroundColor: '#c53030',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#9b2c2c';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(197, 48, 48, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#c53030';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
