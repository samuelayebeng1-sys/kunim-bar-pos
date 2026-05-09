import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';

interface Props { onClose: () => void; }

export default function AdminLoginModal({ onClose }: Props) {
  const { adminCreds, setIsAdmin, setScreen } = useApp();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  function doLogin() {
    if (user === adminCreds.u && pass === adminCreds.p) {
      setIsAdmin(true);
      setScreen('admin');
      onClose();
    } else {
      setError('Incorrect credentials.');
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '460px' }}>
        <div style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: 700, marginBottom: '18px' }}>Admin Access</div>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Username</label>
          <input value={user} onChange={e => setUser(e.target.value)} placeholder="admin"
            style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '11px 13px', color: 'var(--text)', fontSize: '14px', outline: 'none' }} />
        </div>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Password</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLogin()} placeholder="••••••••"
            style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '11px 13px', color: 'var(--text)', fontSize: '14px', outline: 'none' }} />
        </div>
        {error && <div style={{ background: 'rgba(224,16,16,.1)', border: '1px solid rgba(224,16,16,.3)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#ff6b6b', marginBottom: '12px' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button onClick={onClose} style={{ flex: 1, background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', fontFamily: 'Syne', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button onClick={doLogin} style={{ flex: 1, background: 'var(--gold)', color: 'var(--bg)', border: 'none', borderRadius: '10px', padding: '12px', fontFamily: 'Syne', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>Sign In</button>
        </div>
      </div>
    </div>
  );
}
