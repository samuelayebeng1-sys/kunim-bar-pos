import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { hashPassword } from '../../lib/crypto';

interface Props { onClose: () => void; }

const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function AdminLoginModal({ onClose }: Props) {
  const { adminCreds, saveAdminCreds, setIsAdmin, setScreen } = useApp();
  const isFirstRun = adminCreds.p === '';

  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [setupUser, setSetupUser] = useState('admin');
  const [setupPass, setSetupPass] = useState('');
  const [setupConf, setSetupConf] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function doLogin() {
    const hash = await hashPassword(pass);
    if (user === adminCreds.u && hash === adminCreds.p) {
      setIsAdmin(true);
      setScreen('admin');
      onClose();
    } else {
      setError('Incorrect credentials.');
    }
  }

  async function doSetup() {
    if (!setupUser.trim()) { setError('Username cannot be empty.'); return; }
    if (!setupPass) { setError('Please enter a password.'); return; }
    if (setupPass !== setupConf) { setError('Passwords do not match.'); return; }
    setSaving(true);
    setError('');
    try {
      await saveAdminCreds(setupUser.trim(), setupPass);
      setIsAdmin(true);
      setScreen('admin');
      onClose();
    } catch {
      setError('Failed to save credentials. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '11px 13px', color: 'var(--text)', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '11px', color: 'var(--text2)', fontWeight: 700, letterSpacing: '.06em',
    textTransform: 'uppercase', marginBottom: '6px', display: 'block',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '460px' }}>

        {isFirstRun ? (
          <>
            <div style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Set Up Admin Access</div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '18px' }}>
              Create your admin credentials. You'll use these to log in going forward.
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Username</label>
              <input value={setupUser} onChange={e => setSetupUser(e.target.value)} placeholder="admin" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={setupPass}
                  onChange={e => setSetupPass(e.target.value)}
                  placeholder="Choose a strong password"
                  style={{ ...inputStyle, paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '4px', display: 'flex', alignItems: 'center' }}
                >
                  <EyeIcon open={showPass} />
                </button>
              </div>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Confirm Password</label>
              <input type="password" value={setupConf} onChange={e => setSetupConf(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSetup()} placeholder="Repeat password" style={inputStyle} />
            </div>
            {error && <div style={{ background: 'rgba(224,16,16,.1)', border: '1px solid rgba(224,16,16,.3)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#ff6b6b', marginBottom: '12px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button onClick={onClose} style={{ flex: 1, background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', fontFamily: 'Syne', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={doSetup} disabled={saving} style={{ flex: 1, background: 'var(--gold)', color: 'var(--bg)', border: 'none', borderRadius: '10px', padding: '12px', fontFamily: 'Syne', fontSize: '14px', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Create Account'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: 700, marginBottom: '18px' }}>Admin Access</div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Username</label>
              <input value={user} onChange={e => setUser(e.target.value)} placeholder="admin" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doLogin()}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '4px', display: 'flex', alignItems: 'center' }}
                >
                  <EyeIcon open={showPass} />
                </button>
              </div>
            </div>
            {error && <div style={{ background: 'rgba(224,16,16,.1)', border: '1px solid rgba(224,16,16,.3)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#ff6b6b', marginBottom: '12px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button onClick={onClose} style={{ flex: 1, background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', fontFamily: 'Syne', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={doLogin} style={{ flex: 1, background: 'var(--gold)', color: 'var(--bg)', border: 'none', borderRadius: '10px', padding: '12px', fontFamily: 'Syne', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>Sign In</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
