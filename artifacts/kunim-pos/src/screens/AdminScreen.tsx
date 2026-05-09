import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useApp } from '../contexts/AppContext';
import TopNav from '../components/TopNav';
import ItemModal from '../components/modals/ItemModal';
import CashierModal from '../components/modals/CashierModal';
import CategoryModal from '../components/modals/CategoryModal';
import RestockModal from '../components/modals/RestockModal';
import { MenuItem, Cashier, Category, Order } from '../lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

type AdminTab = 'dashboard' | 'menu' | 'stock' | 'categories' | 'cashiers' | 'reports' | 'account';
type ReportPeriod = 'today' | 'week' | 'month' | 'year';

const PIE_COLORS = ['#22c55e', '#f0c040', '#60a5fa'];

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
};

function getDateRange(period: ReportPeriod): { from: string; to: string } {
  const today = new Date().toISOString().split('T')[0];
  if (period === 'today') return { from: today, to: today };
  if (period === 'week') {
    const d = new Date(); d.setDate(d.getDate() - 6);
    return { from: d.toISOString().split('T')[0], to: today };
  }
  if (period === 'month') {
    const d = new Date(); d.setDate(1);
    return { from: d.toISOString().split('T')[0], to: today };
  }
  // year
  const d = new Date(); d.setMonth(0); d.setDate(1);
  return { from: d.toISOString().split('T')[0], to: today };
}

function printAdminReport(
  period: ReportPeriod,
  orders: Order[],
  repTotal: number,
  repByPay: { Cash: number; MoMo: number; Card: number },
  topItems: [string, number][],
  repByDate: Record<string, number>,
) {
  const now = new Date();
  const range = getDateRange(period);
  const avgOrder = orders.length ? (repTotal / orders.length).toFixed(2) : '0.00';

  const topItemsRows = topItems.map(([name, qty], i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${name}</td>
      <td style="text-align:right;font-weight:600">${qty}</td>
    </tr>`).join('');

  const cashierSales: Record<string, number> = {};
  orders.forEach(o => { cashierSales[o.cashier] = (cashierSales[o.cashier] || 0) + (o.total || 0); });
  const cashierRows = Object.entries(cashierSales).sort((a, b) => b[1] - a[1]).map(([name, total]) => `
    <tr>
      <td>${name}</td>
      <td style="text-align:right">GH&#8373; ${total.toFixed(2)}</td>
    </tr>`).join('');

  const dailyRows = Object.keys(repByDate).sort().map(date => `
    <tr>
      <td>${date}</td>
      <td style="text-align:right">GH&#8373; ${repByDate[date].toFixed(2)}</td>
    </tr>`).join('');

  const win = window.open('', '_blank', 'width=900,height=700,toolbar=0,scrollbars=1,status=0');
  if (!win) { alert('Pop-up blocked — please allow pop-ups and try again.'); return; }

  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${PERIOD_LABELS[period]} Report — Kunim Guest House Bar</title>
  <style>
    @page { size: A4 portrait; margin: 18mm 14mm; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; background: #fff; }
    .header { text-align:center; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 16px; }
    .header h1 { font-size: 20px; font-weight: 800; letter-spacing: -.5px; }
    .header .sub { font-size: 11px; color: #555; margin-top: 2px; }
    .header .badge { display: inline-block; margin-top: 6px; background: #111; color: #f0c040; font-size: 11px; font-weight: 700; padding: 3px 14px; border-radius: 20px; letter-spacing: .05em; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
    .stat-card { border: 1px solid #ddd; border-radius: 8px; padding: 10px 12px; }
    .stat-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 4px; }
    .stat-value { font-size: 20px; font-weight: 800; color: #111; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f5f5f5; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #555; padding: 7px 10px; text-align: left; border-bottom: 1px solid #ddd; }
    td { padding: 7px 10px; border-bottom: 1px solid #eee; font-size: 12px; }
    tr:last-child td { border-bottom: none; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .footer { margin-top: 24px; border-top: 1px solid #ddd; padding-top: 10px; text-align: center; font-size: 10px; color: #aaa; }
    @media print {
      body { font-size: 11px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="padding:10px;background:#f5f5f5;border-bottom:1px solid #ddd;display:flex;gap:10px;align-items:center">
    <button onclick="window.print()" style="padding:8px 20px;background:#111;color:#f0c040;border:none;border-radius:6px;font-weight:700;font-size:13px;cursor:pointer">Print / Save PDF</button>
    <button onclick="window.close()" style="padding:8px 16px;background:#fff;color:#555;border:1px solid #ccc;border-radius:6px;font-size:13px;cursor:pointer">Close</button>
    <span style="font-size:11px;color:#888">Tip: Set paper size to A4 and enable "Background graphics" in print settings</span>
  </div>

  <div style="padding:20px">
    <div class="header">
      <h1>Kunim Guest House Bar</h1>
      <div class="sub">Powered by ChalePay &nbsp;|&nbsp; Generated: ${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
      <div class="badge">${PERIOD_LABELS[period].toUpperCase()} REPORT &nbsp;&mdash;&nbsp; ${range.from} to ${range.to}</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Revenue</div>
        <div class="stat-value">GH&#8373; ${repTotal.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Orders</div>
        <div class="stat-value">${orders.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Order</div>
        <div class="stat-value">GH&#8373; ${avgOrder}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Payment Methods</div>
        <div class="stat-value" style="font-size:13px;margin-top:4px">
          Cash: GH&#8373;${repByPay.Cash.toFixed(2)}<br>
          MoMo: GH&#8373;${repByPay.MoMo.toFixed(2)}<br>
          Card: GH&#8373;${repByPay.Card.toFixed(2)}
        </div>
      </div>
    </div>

    <div class="two-col">
      <div class="section">
        <h2>Top Selling Items</h2>
        ${topItems.length === 0 ? '<p style="color:#aaa;font-size:12px">No data</p>' : `
        <table>
          <thead><tr><th>#</th><th>Item</th><th style="text-align:right">Qty Sold</th></tr></thead>
          <tbody>${topItemsRows}</tbody>
        </table>`}
      </div>

      <div class="section">
        <h2>Revenue by Cashier</h2>
        ${Object.keys(cashierSales).length === 0 ? '<p style="color:#aaa;font-size:12px">No data</p>' : `
        <table>
          <thead><tr><th>Cashier</th><th style="text-align:right">Revenue</th></tr></thead>
          <tbody>${cashierRows}</tbody>
        </table>`}
      </div>
    </div>

    ${period !== 'today' ? `
    <div class="section">
      <h2>Daily Revenue Breakdown</h2>
      ${Object.keys(repByDate).length === 0 ? '<p style="color:#aaa;font-size:12px">No data</p>' : `
      <table>
        <thead><tr><th>Date</th><th style="text-align:right">Revenue</th></tr></thead>
        <tbody>${dailyRows}</tbody>
        <tfoot><tr style="font-weight:800;background:#f5f5f5"><td>TOTAL</td><td style="text-align:right">GH&#8373; ${repTotal.toFixed(2)}</td></tr></tfoot>
      </table>`}
    </div>` : ''}

    <div class="footer">
      Kunim Guest House Bar &mdash; Powered by ChalePay &mdash; Confidential
    </div>
  </div>
</body>
</html>`);
  win.document.close();
}

export default function AdminScreen() {
  const { menuItems, setMenuItems, cashiers, setCashiers, categories, setCategories, adminCreds, setAdminCreds } = useApp();
  const [tab, setTab] = useState<AdminTab>('dashboard');

  const [editItem, setEditItem] = useState<MenuItem | null | undefined>(undefined);
  const [editCashier, setEditCashier] = useState<Cashier | null | undefined>(undefined);
  const [showCatModal, setShowCatModal] = useState(false);
  const [restockItem, setRestockItem] = useState<MenuItem | null>(null);

  const [dashOrders, setDashOrders] = useState<Order[]>([]);
  const [weekData, setWeekData] = useState<{ date: string; revenue: number }[]>([]);

  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('today');
  const [reportOrders, setReportOrders] = useState<Order[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  const [newUser, setNewUser] = useState(adminCreds.u);
  const [newPass, setNewPass] = useState('');
  const [confPass, setConfPass] = useState('');
  const [accMsg, setAccMsg] = useState('');

  useEffect(() => {
    if (tab === 'dashboard') loadDashboard();
    if (tab === 'reports') loadAdminReports('today');
  }, [tab]);

  async function loadDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const snap = await getDocs(query(collection(db, 'orders'), where('date', '==', today)));
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
    setDashOrders(orders);

    const d = new Date();
    const wk: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const dd = new Date(d); dd.setDate(d.getDate() - i);
      wk.push(dd.toISOString().split('T')[0]);
    }
    const ws = await getDocs(query(collection(db, 'orders'), where('date', '>=', wk[0]), where('date', '<=', today)));
    const wd: Record<string, number> = {};
    wk.forEach(x => wd[x] = 0);
    ws.docs.forEach(d => { const o = d.data() as Order; if (wd[o.date] !== undefined) wd[o.date] += o.total || 0; });
    setWeekData(wk.map(x => ({ date: x.slice(5), revenue: parseFloat((wd[x] || 0).toFixed(2)) })));
  }

  async function loadAdminReports(period: ReportPeriod) {
    setReportPeriod(period);
    setReportLoading(true);
    const { from, to } = getDateRange(period);
    try {
      const snap = await getDocs(query(collection(db, 'orders'), where('date', '>=', from), where('date', '<=', to)));
      setReportOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    } finally {
      setReportLoading(false);
    }
  }

  async function delItem(id: string) {
    if (!confirm('Delete this item?')) return;
    await deleteDoc(doc(db, 'menu', id));
    setMenuItems(menuItems.filter(m => m.id !== id));
  }

  async function delCashier(id: string) {
    if (!confirm('Remove this cashier?')) return;
    await deleteDoc(doc(db, 'cashiers', id));
    setCashiers(cashiers.filter(c => c.id !== id));
  }

  async function delCat(cat: Category) {
    const inUse = menuItems.some(m => m.category === cat.name);
    if (inUse) { alert('Cannot delete — some menu items use this category. Reassign them first.'); return; }
    if (!confirm(`Delete category: ${cat.name}?`)) return;
    await deleteDoc(doc(db, 'categories', cat.id));
    setCategories(categories.filter(c => c.id !== cat.id));
  }

  function saveAccount() {
    if (newPass && newPass !== confPass) { alert('Passwords do not match.'); return; }
    setAdminCreds({ u: newUser || adminCreds.u, p: newPass || adminCreds.p });
    setAccMsg('Changes saved.');
    setTimeout(() => setAccMsg(''), 3000);
  }

  // Dashboard calcs
  const dashTotal = dashOrders.reduce((s, o) => s + (o.total || 0), 0);
  const dashByPay = { Cash: 0, MoMo: 0, Card: 0 };
  dashOrders.forEach(o => { if (dashByPay[o.paymentMethod] !== undefined) dashByPay[o.paymentMethod] += o.total || 0; });
  const dashPieData = [
    { name: 'Cash', value: parseFloat(dashByPay.Cash.toFixed(2)) },
    { name: 'MoMo', value: parseFloat(dashByPay.MoMo.toFixed(2)) },
    { name: 'Card', value: parseFloat(dashByPay.Card.toFixed(2)) },
  ].filter(d => d.value > 0);

  // Report calcs
  const repByDate: Record<string, number> = {};
  const repByItem: Record<string, number> = {};
  const repByPay = { Cash: 0, MoMo: 0, Card: 0 };
  let repTotal = 0;
  reportOrders.forEach(o => {
    repByDate[o.date] = (repByDate[o.date] || 0) + (o.total || 0);
    repTotal += o.total || 0;
    if (repByPay[o.paymentMethod] !== undefined) repByPay[o.paymentMethod] += o.total || 0;
    (o.items || []).forEach(i => { repByItem[i.name] = (repByItem[i.name] || 0) + i.qty; });
  });
  const repBarData = Object.keys(repByDate).sort().map(date => ({ date: date.slice(5), revenue: parseFloat(repByDate[date].toFixed(2)) }));
  const repPieData = [
    { name: 'Cash', value: parseFloat(repByPay.Cash.toFixed(2)) },
    { name: 'MoMo', value: parseFloat(repByPay.MoMo.toFixed(2)) },
    { name: 'Card', value: parseFloat(repByPay.Card.toFixed(2)) },
  ].filter(d => d.value > 0);
  const repTopItems = Object.entries(repByItem).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'menu', label: 'Menu Items' },
    { id: 'stock', label: 'Stock' },
    { id: 'categories', label: 'Categories' },
    { id: 'cashiers', label: 'Cashiers' },
    { id: 'reports', label: 'Reports' },
    { id: 'account', label: 'Account' },
  ];

  const cardStyle: React.CSSProperties = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', marginBottom: '14px' };
  const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '11px 13px', color: 'var(--text)', fontSize: '14px', outline: 'none' };
  const labelStyle: React.CSSProperties = { fontSize: '11px', color: 'var(--text2)', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' as const, marginBottom: '6px', display: 'block' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopNav isAdmin />

      {/* Admin Nav */}
      <div style={{ display: 'flex', gap: '3px', padding: '10px 12px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', overflowX: 'auto', flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: 'none', background: tab === t.id ? 'rgba(224,16,16,.1)' : 'transparent', color: tab === t.id ? 'var(--red)' : 'var(--text2)', whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: 700 }}>Dashboard</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '18px' }}>
              {[
                { label: 'Today Revenue', value: `GH₵${dashTotal.toFixed(2)}` },
                { label: 'Orders', value: dashOrders.length.toString() },
                { label: 'Menu Items', value: menuItems.length.toString() },
                { label: 'Cashiers', value: cashiers.length.toString() },
              ].map(s => (
                <div key={s.label} style={cardStyle}>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '5px' }}>{s.label}</div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 800, color: 'var(--gold)' }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={cardStyle}>
              <div style={{ fontFamily: 'Syne', fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Today — Payment Breakdown</div>
              {dashPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={dashPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={30}>
                      {dashPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Legend formatter={v => <span style={{ color: 'var(--text2)', fontSize: '12px' }}>{v}</span>} />
                    <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} formatter={(v: number) => `GH₵${v.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div style={{ color: 'var(--text3)', fontSize: '13px' }}>No orders today yet</div>}
            </div>
            <div style={cardStyle}>
              <div style={{ fontFamily: 'Syne', fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>This Week — Daily Revenue (GH₵)</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weekData}>
                  <XAxis dataKey="date" tick={{ fill: '#999', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#999', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} />
                  <Bar dataKey="revenue" fill="rgba(224,16,16,.7)" stroke="var(--red)" strokeWidth={2} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* MENU ITEMS */}
        {tab === 'menu' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: 700 }}>Menu Items</div>
              <button onClick={() => setEditItem(null)} style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 18px', fontFamily: 'Syne', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>+ Add Item</button>
            </div>
            {menuItems.length === 0 ? <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)' }}>No items yet</div> :
              menuItems.map(item => (
                <div key={item.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '13px', display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '10px' }}>
                  {item.photo ? <img src={item.photo} style={{ width: '52px', height: '52px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} /> :
                    <div style={{ width: '52px', height: '52px', borderRadius: '10px', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, color: 'var(--text3)' }}>🍺</div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Syne', fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)' }}><span style={{ display: 'inline-block', background: 'rgba(240,192,64,.1)', border: '1px solid rgba(240,192,64,.2)', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', color: 'var(--gold)', fontWeight: 700 }}>{item.category}</span></div>
                    <div style={{ fontFamily: 'Syne', fontSize: '14px', fontWeight: 800, color: 'var(--gold)', marginTop: '3px' }}>GH₵{item.price.toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0 }}>
                    <button onClick={() => setEditItem(item)} style={{ background: 'rgba(240,192,64,.1)', border: '1px solid rgba(240,192,64,.2)', borderRadius: '8px', padding: '5px 11px', fontSize: '11px', color: 'var(--gold)', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => delItem(item.id)} style={{ background: 'rgba(224,16,16,.1)', border: '1px solid rgba(224,16,16,.2)', borderRadius: '8px', padding: '5px 11px', fontSize: '11px', color: 'var(--red)', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
          </>
        )}

        {/* STOCK */}
        {tab === 'stock' && (
          <>
            <div style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Stock Management</div>
            {menuItems.map(item => (
              <div key={item.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '13px', display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '10px' }}>
                {item.photo ? <img src={item.photo} style={{ width: '52px', height: '52px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} /> :
                  <div style={{ width: '52px', height: '52px', borderRadius: '10px', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, color: 'var(--text3)' }}>🍺</div>}
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Syne', fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>{item.name}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '3px' }}>{item.stock} units</div>
                  <div style={{ fontSize: '12px', marginTop: '2px', color: item.stock <= 0 ? 'var(--red)' : item.stock <= 5 ? 'var(--warning)' : 'var(--success)', fontWeight: 700 }}>
                    {item.stock <= 0 ? 'Out of stock' : item.stock <= 5 ? 'Low stock' : 'Good'}
                  </div>
                </div>
                <button onClick={() => setRestockItem(item)} style={{ background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.2)', borderRadius: '8px', padding: '5px 11px', fontSize: '11px', color: 'var(--success)', fontWeight: 700, cursor: 'pointer' }}>+ Stock</button>
              </div>
            ))}
          </>
        )}

        {/* CATEGORIES */}
        {tab === 'categories' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: 700 }}>Categories</div>
              <button onClick={() => setShowCatModal(true)} style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 18px', fontFamily: 'Syne', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>+ Add Category</button>
            </div>
            {categories.length === 0 ? <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)' }}>No categories yet</div> :
              categories.map(cat => (
                <div key={cat.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '13px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ fontFamily: 'Syne', fontSize: '14px', fontWeight: 700, flex: 1 }}>{cat.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{menuItems.filter(m => m.category === cat.name).length} items</div>
                  <button onClick={() => delCat(cat)} style={{ background: 'rgba(224,16,16,.1)', border: '1px solid rgba(224,16,16,.2)', borderRadius: '8px', padding: '5px 11px', fontSize: '11px', color: 'var(--red)', fontWeight: 700, cursor: 'pointer' }}>Remove</button>
                </div>
              ))}
          </>
        )}

        {/* CASHIERS */}
        {tab === 'cashiers' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: 700 }}>Cashiers</div>
              <button onClick={() => setEditCashier(null)} style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 18px', fontFamily: 'Syne', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>+ Add Cashier</button>
            </div>
            {cashiers.length === 0 ? <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)' }}>No cashiers</div> :
              cashiers.map(c => (
                <div key={c.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '13px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  {c.photo ? <img src={c.photo} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border)' }} /> :
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--gold)', color: 'var(--bg)', fontFamily: 'Syne', fontWeight: 800, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.name[0]}</div>}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Syne', fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>{c.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Cashier</div>
                  </div>
                  <div style={{ display: 'flex', gap: '7px' }}>
                    <button onClick={() => setEditCashier(c)} style={{ background: 'rgba(240,192,64,.1)', border: '1px solid rgba(240,192,64,.2)', borderRadius: '8px', padding: '5px 11px', fontSize: '11px', color: 'var(--gold)', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => delCashier(c.id)} style={{ background: 'rgba(224,16,16,.1)', border: '1px solid rgba(224,16,16,.2)', borderRadius: '8px', padding: '5px 11px', fontSize: '11px', color: 'var(--red)', fontWeight: 700, cursor: 'pointer' }}>Remove</button>
                  </div>
                </div>
              ))}
          </>
        )}

        {/* REPORTS */}
        {tab === 'reports' && (
          <>
            {/* Header row with Print button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: 700 }}>Reports</div>
              <button
                onClick={() => printAdminReport(reportPeriod, reportOrders, repTotal, repByPay, repTopItems, repByDate)}
                disabled={reportOrders.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '7px', background: reportOrders.length === 0 ? 'var(--bg3)' : 'var(--gold)', color: reportOrders.length === 0 ? 'var(--text3)' : 'var(--bg)', border: 'none', borderRadius: '10px', padding: '9px 18px', fontFamily: 'Syne', fontSize: '13px', fontWeight: 800, cursor: reportOrders.length === 0 ? 'not-allowed' : 'pointer', transition: 'all .2s' }}
              >
                <span>🖨</span>
                Print {PERIOD_LABELS[reportPeriod]} Report
              </button>
            </div>

            {/* Period selector */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {(['today', 'week', 'month', 'year'] as ReportPeriod[]).map(p => (
                <button key={p} onClick={() => loadAdminReports(p)}
                  style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: `1px solid ${reportPeriod === p ? 'var(--red)' : 'var(--border)'}`, background: reportPeriod === p ? 'var(--red)' : 'var(--bg3)', color: reportPeriod === p ? '#fff' : 'var(--text2)', fontFamily: 'Syne', cursor: 'pointer' }}>
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>

            {reportLoading ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)' }}>Loading...</div>
            ) : (
              <>
                {/* Summary stat cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                  {[
                    { label: 'Revenue', value: `GH₵${repTotal.toFixed(2)}` },
                    { label: 'Orders', value: reportOrders.length.toString() },
                    { label: 'Avg Order', value: `GH₵${reportOrders.length ? (repTotal / reportOrders.length).toFixed(2) : '0'}` },
                  ].map(s => (
                    <div key={s.label} style={cardStyle}>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '5px' }}>{s.label}</div>
                      <div style={{ fontFamily: 'Syne', fontSize: '22px', fontWeight: 800, color: 'var(--gold)' }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Payment breakdown pills */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Cash', icon: '💵', val: repByPay.Cash, col: 'var(--success)' },
                    { label: 'MoMo', icon: '📱', val: repByPay.MoMo, col: 'var(--gold)' },
                    { label: 'Card', icon: '💳', val: repByPay.Card, col: '#60a5fa' },
                  ].map(p => (
                    <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 14px' }}>
                      <span>{p.icon}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{p.label}</span>
                      <span style={{ fontFamily: 'Syne', fontSize: '13px', fontWeight: 800, color: p.col }}>GH₵{p.val.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div style={cardStyle}>
                  <div style={{ fontFamily: 'Syne', fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Revenue Over Time (GH₵)</div>
                  {repBarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={repBarData}>
                        <XAxis dataKey="date" tick={{ fill: '#999', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#999', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} />
                        <Bar dataKey="revenue" fill="rgba(240,192,64,.7)" stroke="#f0c040" strokeWidth={2} radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div style={{ color: 'var(--text3)', fontSize: '13px' }}>No data for this period</div>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={cardStyle}>
                    <div style={{ fontFamily: 'Syne', fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Payment Methods</div>
                    {repPieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={repPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={30}>
                            {repPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Legend formatter={v => <span style={{ color: 'var(--text2)', fontSize: '12px' }}>{v}</span>} />
                          <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} formatter={(v: number) => `GH₵${v.toFixed(2)}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <div style={{ color: 'var(--text3)', fontSize: '13px' }}>No data</div>}
                  </div>
                  <div style={cardStyle}>
                    <div style={{ fontFamily: 'Syne', fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Top Items</div>
                    {repTopItems.length === 0 ? <p style={{ color: 'var(--text3)', fontSize: '13px' }}>No data yet</p> :
                      repTopItems.map(([name, qty], i) => (
                        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '9px' }}>
                          <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--gold)', color: 'var(--bg)', fontFamily: 'Syne', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                          <div style={{ flex: 1, fontSize: '13px', fontWeight: 600 }}>{name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 700 }}>{qty} sold</div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ACCOUNT */}
        {tab === 'account' && (
          <>
            <div style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>My Account</div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', maxWidth: '400px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Admin Username</label>
                <input value={newUser} onChange={e => setNewUser(e.target.value)} placeholder="Enter username" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>New Password</label>
                <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Confirm Password</label>
                <input type="password" value={confPass} onChange={e => setConfPass(e.target.value)} placeholder="Confirm password" style={inputStyle} />
              </div>
              <button onClick={saveAccount} style={{ width: '100%', background: 'var(--gold)', color: 'var(--bg)', border: 'none', borderRadius: '10px', padding: '12px', fontFamily: 'Syne', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>Save Changes</button>
              {accMsg && <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--success)' }}>{accMsg}</div>}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {editItem !== undefined && (
        <ItemModal item={editItem} categories={categories} onClose={() => setEditItem(undefined)} onSaved={() => {}} />
      )}
      {editCashier !== undefined && (
        <CashierModal cashier={editCashier} onClose={() => setEditCashier(undefined)} onSaved={() => {}} />
      )}
      {showCatModal && (
        <CategoryModal onClose={() => setShowCatModal(false)} onSaved={() => {}} />
      )}
      {restockItem && (
        <RestockModal item={restockItem} onClose={() => setRestockItem(null)} onSaved={() => {}} />
      )}
    </div>
  );
}
