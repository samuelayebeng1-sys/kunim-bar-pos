import { useState } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useApp } from '../../contexts/AppContext';
import { Cashier } from '../../lib/types';

interface Props {
  cashier?: Cashier | null;
  onClose: () => void;
  onSaved: () => void;
}

const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function CashierModal({ cashier, onClose, onSaved }: Props) {
  const { cashiers, setCashiers } = useApp();
  const [name, setName] = useState(cashier?.name || '');
  const [pin, setPin] = useState(cashier?.pin || '');
  const [showPin, setShowPin] = useState(false);
  const [photo, setPhoto] = useState(cashier?.photo || '');
  const [saving, setSaving] = useState(false);

  async function imgToBase64(file: File): Promise<string> {
    return new Promise(res => {
      const r = new FileReader();
      r.onload = e => res(e.target?.result as string);
      r.readAsDataURL(file);
    });
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhoto(await imgToBase64(f));
  }

  async function save() {
    if (!name.trim() || !pin.trim()) { alert('Please enter name and PIN.'); return; }
    setSaving(true);
    const data = { name: name.trim(), pin: pin.trim(), photo };
    try {
      if (cashier) {
        await updateDoc(doc(db, 'cashiers', cashier.id), data);
        setCashiers(cashiers.map(c => c.id === cashier.id ? { id: cashier.id, ...data } : c));
      } else {
        const ref = await addDoc(collection(db, 'cashiers'), data);
        setCashiers([...cashiers, { id: ref.id, ...data }]);
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '11px 13px', color: 'var(--text)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: '11px', color: 'var(--text2)', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' as const, marginBottom: '6px', display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '460px' }}>
        <div style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: 700, marginBottom: '18px' }}>{cashier ? 'Edit Cashier' : 'Add Cashier'}</div>
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Full Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ama" style={inputStyle} />
        </div>
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>PIN *</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="e.g. 1234"
              maxLength={6}
              style={{ ...inputStyle, paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowPin(v => !v)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '4px', display: 'flex', alignItems: 'center' }}
            >
              <EyeIcon open={showPin} />
            </button>
          </div>
        </div>
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Photo (optional)</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ ...inputStyle, padding: '8px 13px' }} />
          {photo && <img src={photo} style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', marginTop: '8px', border: '2px solid var(--gold)' }} />}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button onClick={onClose} style={{ flex: 1, background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', fontFamily: 'Syne', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ flex: 1, background: 'var(--gold)', color: 'var(--bg)', border: 'none', borderRadius: '10px', padding: '12px', fontFamily: 'Syne', fontSize: '14px', fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Save Cashier'}</button>
        </div>
      </div>
    </div>
  );
}
