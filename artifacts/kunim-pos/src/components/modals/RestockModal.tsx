import { useState } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useApp } from '../../contexts/AppContext';
import { MenuItem } from '../../lib/types';

interface Props {
  item: MenuItem;
  onClose: () => void;
  onSaved: () => void;
}

export default function RestockModal({ item, onClose, onSaved }: Props) {
  const { menuItems, setMenuItems } = useApp();
  const [qty, setQty] = useState('');
  const [saving, setSaving] = useState(false);

  async function doRestock() {
    const q = parseInt(qty);
    if (!q || q <= 0) { alert('Enter a valid quantity.'); return; }
    setSaving(true);
    try {
      const newStock = item.stock + q;
      await updateDoc(doc(db, 'menu', item.id), { stock: newStock });
      setMenuItems(menuItems.map(m => m.id === item.id ? { ...m, stock: newStock } : m));
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '400px' }}>
        <div style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Restock Item</div>
        <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '4px' }}>Item: <strong style={{ color: 'var(--gold)' }}>{item.name}</strong></p>
        <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '16px' }}>Current stock: <strong>{item.stock}</strong></p>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' as const, marginBottom: '6px', display: 'block' }}>Quantity to Add *</label>
          <input type="number" value={qty} onChange={e => setQty(e.target.value)} onKeyDown={e => e.key === 'Enter' && doRestock()} placeholder="e.g. 24"
            style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '11px 13px', color: 'var(--text)', fontSize: '14px', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button onClick={onClose} style={{ flex: 1, background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', fontFamily: 'Syne', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button onClick={doRestock} disabled={saving} style={{ flex: 1, background: 'var(--gold)', color: 'var(--bg)', border: 'none', borderRadius: '10px', padding: '12px', fontFamily: 'Syne', fontSize: '14px', fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Add Stock'}</button>
        </div>
      </div>
    </div>
  );
}
