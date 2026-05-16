import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import TopNav from '../components/TopNav';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import { Order } from '../lib/types';

interface Props {
  onEndShift: () => void;
}

export default function ReportsScreen({ onEndShift }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadReports() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'orders'), where('date', '>=', from), where('date', '<=', to)));
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  const byDate: Record<string, number> = {};
  const byItem: Record<string, number> = {};
  const byPay = { Cash: 0, MoMo: 0, Card: 0 };
  let total = 0;

  orders.forEach(o => {
    byDate[o.date] = (byDate[o.date] || 0) + (o.total || 0);
    total += o.total || 0;
    if (byPay[o.paymentMethod] !== undefined) byPay[o.paymentMethod] += o.total || 0;
    (o.items || []).forEach(i => { byItem[i.name] = (byItem[i.name] || 0) + i.qty; });
  });

  const barData = Object.keys(byDate).sort().map(date => ({ date: date.slice(5), revenue: parseFloat(byDate[date].toFixed(2)) }));
  const pieData = [
    { name: 'Cash', value: parseFloat(byPay.Cash.toFixed(2)) },
    { name: 'MoMo', value: parseFloat(byPay.MoMo.toFixed(2)) },
    { name: 'Card', value: parseFloat(byPay.Card.toFixed(2)) },
  ].filter(d => d.value > 0);
  const topItems = Object.entries(byItem).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const PIE_COLORS = ['#22c55e', '#f0c040', '#60a5fa'];

  const inputStyle: React.CSSProperties = { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '9px 13px', color: 'var(--text)', fontSize: '14px', outline: 'none', width: '148px' };
  const cardStyle: React.CSSProperties = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', marginBottom: '14px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopNav activeTab="reports" onEndShift={onEndShift} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 600 }}>From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inputStyle} />
          <label style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 600 }}>To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={inputStyle} />
          <button onClick={loadReports} style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 18px', fontFamily: 'Syne', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            {loading ? 'Loading...' : 'Apply'}
          </button>
        </div>

        {loaded && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '18px' }}>
              {[
                { label: 'Revenue', value: `GH₵${total.toFixed(2)}` },
                { label: 'Orders', value: orders.length.toString() },
                { label: 'Avg Order', value: `GH₵${orders.length ? (total / orders.length).toFixed(2) : '0'}` },
              ].map(s => (
                <div key={s.label} style={cardStyle}>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '5px' }}>{s.label}</div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 800, color: 'var(--gold)' }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={cardStyle}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Daily Revenue (GH₵)</div>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={barData} margin={{ top: 10, right: 16, left: 4, bottom: 4 }} barCategoryGap="28%">
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#999', fontSize: 11 }} axisLine={false} tickLine={false} dy={4} />
                    <YAxis tick={{ fill: '#999', fontSize: 11 }} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => `GH₵${v}`} />
                    <Tooltip cursor={{ fill: 'rgba(240,192,64,0.08)' }} contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} formatter={(v: number) => [`GH₵${v.toFixed(2)}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#f0c040" radius={[8, 8, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div style={{ color: 'var(--text3)', fontSize: '13px' }}>No data for this period</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={cardStyle}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Payment Breakdown</div>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Legend formatter={(v) => <span style={{ color: 'var(--text2)', fontSize: '12px' }}>{v}</span>} />
                      <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} formatter={(v: number) => `GH₵${v.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div style={{ color: 'var(--text3)', fontSize: '13px' }}>No data</div>}
              </div>
              <div style={cardStyle}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Top Selling Items</div>
                {topItems.length === 0 ? (
                  <p style={{ color: 'var(--text3)', fontSize: '13px' }}>No data yet</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    {topItems.map(([name, qty], i) => (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--gold)', color: 'var(--bg)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ flex: 1, fontSize: '13px', fontWeight: 600 }}>{name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>{qty} sold</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {!loaded && !loading && (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text3)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
            <p>Select a date range and click Apply</p>
          </div>
        )}
      </div>
    </div>
  );
}
