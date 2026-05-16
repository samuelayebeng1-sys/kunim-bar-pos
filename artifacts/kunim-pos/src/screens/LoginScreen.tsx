import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Cashier } from '../lib/types';
import AdminLoginModal from '../components/modals/AdminLoginModal';

const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function LoginScreen() {
  const { cashiers, setCurrentCashier, setScreen, loading } = useApp();
  const [selectedCashier, setSelectedCashier] = useState<Cashier | null>(null);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);

  function doLogin() {
    if (!selectedCashier) { setError('Please select your name first.'); return; }
    if (selectedCashier.pin === pin) {
      setCurrentCashier(selectedCashier);
      setScreen('pos');
      setError('');
      setPin('');
    } else {
      setError('Incorrect PIN. Please try again.');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '24px', padding: '36px', width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '19px', fontWeight: 800, color: 'var(--gold)', marginBottom: '4px' }}>
            Kunim Guest House Bar
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Powered by <span style={{ color: 'var(--red)', fontWeight: 700 }}>ChalePay</span>
          </div>
        </div>

        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '21px', fontWeight: 700, marginBottom: '4px' }}>Welcome Back</h2>
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '22px' }}>Select your name then enter your PIN</p>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '24px 0' }}>Loading staff...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
            {cashiers.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCashier(c)}
                style={{
                  background: selectedCashier?.id === c.id ? 'rgba(240,192,64,0.08)' : 'var(--bg3)',
                  border: `1.5px solid ${selectedCashier?.id === c.id ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: '14px', padding: '14px 8px', textAlign: 'center', cursor: 'pointer', transition: 'all .2s'
                }}
              >
                {c.photo ? (
                  <img src={c.photo} alt={c.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 8px', display: 'block', border: '2px solid var(--border)' }} />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--gold)', color: 'var(--bg)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    {c.name[0]}
                  </div>
                )}
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>{c.name}</div>
              </button>
            ))}
          </div>
        )}

        <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 600, marginBottom: '7px' }}>Enter PIN</p>
        <div style={{ position: 'relative' }}>
          <input
            type={showPin ? 'text' : 'password'}
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doLogin()}
            placeholder="• • • •"
            maxLength={6}
            style={{
              width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '12px',
              padding: '13px 48px 13px 16px', color: 'var(--text)', fontSize: '22px', letterSpacing: showPin ? '0.1em' : '0.4em',
              outline: 'none', textAlign: 'center', transition: 'border-color .2s', boxSizing: 'border-box'
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--gold)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
          />
          <button
            type="button"
            onClick={() => setShowPin(v => !v)}
            style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '4px', display: 'flex', alignItems: 'center' }}
          >
            <EyeIcon open={showPin} />
          </button>
        </div>
        <button
          onClick={doLogin}
          style={{
            width: '100%', background: 'var(--gold)', color: 'var(--bg)', border: 'none', borderRadius: '12px',
            padding: '14px', fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 800, marginTop: '14px', transition: 'all .2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-dark)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}
        >
          Sign In
        </button>

        {error && (
          <div style={{ background: 'rgba(224,16,16,.1)', border: '1px solid rgba(224,16,16,.3)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#ff6b6b', marginTop: '12px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div
          onClick={() => setShowAdmin(true)}
          style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: 'var(--text3)', cursor: 'pointer', padding: '6px', transition: 'color .2s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
        >
          Admin Access
        </div>
      </div>

      {showAdmin && <AdminLoginModal onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
