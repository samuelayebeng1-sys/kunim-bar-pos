import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import TopNav from '../components/TopNav';
import { Order } from '../lib/types';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const snap = await getDocs(query(collection(db, 'orders'), where('date', '==', today), orderBy('timestamp', 'desc')));
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOrders(); }, []);

  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const cash = orders.filter(o => o.paymentMethod === 'Cash').reduce((s, o) => s + o.total, 0);
  const momo = orders.filter(o => o.paymentMethod === 'MoMo').reduce((s, o) => s + o.total, 0);
  const card = orders.filter(o => o.paymentMethod === 'Card').reduce((s, o) => s + o.total, 0);

  const stats = [
    { label: 'Revenue', value: `GH₵${revenue.toFixed(2)}`, sub: 'Today' },
    { label: 'Orders', value: orders.length.toString() },
    { label: 'Cash', value: `GH₵${cash.toFixed(2)}` },
    { label: 'MoMo', value: `GH₵${momo.toFixed(2)}` },
    { label: 'Card', value: `GH₵${card.toFixed(2)}` },
  ];

  function formatTime(ts: any) {
    if (!ts) return '';
    try {
      const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopNav activeTab="orders" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '18px' }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '5px' }}>{s.label}</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 800, color: 'var(--gold)' }}>{s.value}</div>
              {s.sub && <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '48px' }}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text3)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>—</div>
            <p>No orders today yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {orders.map(o => (
              <div key={o.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 700 }}>{o.customer}{o.table && o.table !== '-' ? ` · ${o.table}` : ''}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>By {o.cashier}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{formatTime(o.timestamp)}</div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px', lineHeight: '1.7' }}>
                  {(o.items || []).map(i => `${i.name} x${i.qty}`).join(' · ')}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 800, color: 'var(--gold)' }}>GH₵ {(o.total || 0).toFixed(2)}</div>
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                    background: o.paymentMethod === 'Cash' ? 'rgba(34,197,94,.1)' : o.paymentMethod === 'MoMo' ? 'rgba(240,192,64,.1)' : 'rgba(59,130,246,.1)',
                    color: o.paymentMethod === 'Cash' ? 'var(--success)' : o.paymentMethod === 'MoMo' ? 'var(--gold)' : '#60a5fa',
                    border: `1px solid ${o.paymentMethod === 'Cash' ? 'rgba(34,197,94,.2)' : o.paymentMethod === 'MoMo' ? 'rgba(240,192,64,.2)' : 'rgba(59,130,246,.2)'}`,
                  }}>{o.paymentMethod}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
