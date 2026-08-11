import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function UserInfo() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        zIndex: 1000,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          borderRadius: '50%',
        }}
      >
        {user.picture && (
          <img
            src={user.picture}
            alt="profile"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              transition: 'transform 0.2s ease',
              transform: isOpen ? 'scale(1.05)' : 'scale(1)',
            }}
          />
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '50px',
            right: 0,
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
            padding: '1rem',
            minWidth: '280px',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              {user.picture && (
                <img
                  src={user.picture}
                  alt="profile"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                {user.name && (
                  <div style={{ fontWeight: 600, color: '#1a202c' }}>
                    {user.name}
                  </div>
                )}
                {user.email && (
                  <div style={{ color: '#718096', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {user.email}
                  </div>
                )}
              </div>
            </div>

            {user.email_verified && (
              <div
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '6px',
                  color: '#166534',
                  fontSize: '0.8rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>✓</span> Email verified
              </div>
            )}
          </div>

          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fecaca';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
            }}
          >
            Sign Out
          </button>
        </div>
      )}

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: -1,
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
