import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useApp } from '../../contexts/AppContext';
import { MenuItem, Category } from '../../lib/types';

interface Props {
  item?: MenuItem | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ItemModal({ item, categories, onClose, onSaved }: Props) {
  const { menuItems, setMenuItems } = useApp();
  const [name, setName] = useState(item?.name || '');
  const [category, setCategory] = useState(item?.category || categories[0]?.name || '');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [stock, setStock] = useState(item?.stock?.toString() || '');
  const [photo, setPhoto] = useState(item?.photo || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (categories.length && !category) setCategory(categories[0].name);
  }, [categories]);

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
    const b64 = await imgToBase64(f);
    setPhoto(b64);
  }

  async function save() {
    if (!name.trim() || !price) { alert('Please enter item name and price.'); return; }
    setSaving(true);
    const data = { name: name.trim(), category, price: parseFloat(price), stock: parseInt(stock) || 0, photo };
    try {
      if (item) {
        await updateDoc(doc(db, 'menu', item.id), data);
        setMenuItems(menuItems.map(m => m.id === item.id ? { id: item.id, ...data } : m));
      } else {
        const ref = await addDoc(collection(db, 'menu'), data);
        setMenuItems([...menuItems, { id: ref.id, ...data }]);
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '11px 13px', color: 'var(--text)', fontSize: '14px', outline: 'none' };
  const labelStyle: React.CSSProperties = { fontSize: '11px', color: 'var(--text2)', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' as const, marginBottom: '6px', display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '460px', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: 700, marginBottom: '18px' }}>{item ? 'Edit Item' : 'Add Menu Item'}</div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Item Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Star Beer" style={inputStyle} />
        </div>
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Category *</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, background: 'var(--bg3)' }}>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Price (GH₵) *</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 15" style={inputStyle} />
        </div>
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Stock</label>
          <input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="e.g. 24" style={inputStyle} />
        </div>
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Item Photo (optional)</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ ...inputStyle, padding: '8px 13px' }} />
          {photo && <img src={photo} style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover', marginTop: '8px', border: '1px solid var(--border)' }} />}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button onClick={onClose} style={{ flex: 1, background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', fontFamily: 'Syne', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ flex: 1, background: 'var(--gold)', color: 'var(--bg)', border: 'none', borderRadius: '10px', padding: '12px', fontFamily: 'Syne', fontSize: '14px', fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Save Item'}</button>
        </div>
      </div>
    </div>
  );
}
