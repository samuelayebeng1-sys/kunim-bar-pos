import { Order } from '../../lib/types';

interface Props {
  cashierName: string;
  shiftStart: Date;
  orders: Order[];
  onClose: () => void;
  onEndShift: () => void;
}

export default function ShiftSummaryModal({ cashierName, shiftStart, orders, onClose, onEndShift }: Props) {
  const now = new Date();
  const total = orders.reduce((s, o) => s + (o.total || 0), 0);
  const byPay = { Cash: 0, MoMo: 0, Card: 0 };
  orders.forEach(o => { if (byPay[o.paymentMethod] !== undefined) byPay[o.paymentMethod] += o.total || 0; });
  const itemCounts: Record<string, number> = {};
  orders.forEach(o => o.items.forEach(i => { itemCounts[i.name] = (itemCounts[i.name] || 0) + i.qty; }));
  const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const duration = (() => {
    const diff = Math.floor((now.getTime() - shiftStart.getTime()) / 60000);
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  })();

  function fmt(d: Date) {
    return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  }

  function printSummary() {
    const itemRows = topItems.map(([name, qty]) => `<tr><td>${name}</td><td style="text-align:right">${qty}</td></tr>`).join('');
    const payRows = Object.entries(byPay).filter(([, v]) => v > 0).map(([k, v]) =>
      `<tr><td>${k}</td><td style="text-align:right">GH&#8373; ${v.toFixed(2)}</td></tr>`).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Shift Summary</title>
  <style>
    @page { size: 72mm auto; margin: 0; }
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { background:#fff; color:#000; }
    body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 72mm; padding: 4mm 3mm; }
    .center { text-align:center; }
    .bold { font-weight:bold; }
    .big { font-size:15px; }
    .small { font-size:10px; color:#555; }
    .dashed { border-top:1px dashed #000; margin:3mm 0; }
    table { width:100%; border-collapse:collapse; }
    td { padding: 2px 0; }
    .section-title { font-weight:bold; font-size:11px; margin-bottom:2mm; }
    .total-row td { font-size:14px; font-weight:bold; }
  </style>
</head>
<body>
  <div class="center">
    <div class="bold big">Kunim Guest House Bar</div>
    <div class="small">Powered by ChalePay</div>
    <div class="bold" style="margin-top:2mm">SHIFT SUMMARY</div>
  </div>
  <div class="dashed"></div>
  <table>
    <tr><td>Cashier</td><td style="text-align:right"><strong>${cashierName}</strong></td></tr>
    <tr><td>Shift Start</td><td style="text-align:right">${fmt(shiftStart)}</td></tr>
    <tr><td>Shift End</td><td style="text-align:right">${fmt(now)}</td></tr>
    <tr><td>Duration</td><td style="text-align:right">${duration}</td></tr>
  </table>
  <div class="dashed"></div>
  <div class="section-title">SALES SUMMARY</div>
  <table>
    <tr><td>Total Orders</td><td style="text-align:right">${orders.length}</td></tr>
    <tr class="total-row"><td>Total Revenue</td><td style="text-align:right">GH&#8373; ${total.toFixed(2)}</td></tr>
    ${orders.length > 0 ? `<tr><td>Avg. Order</td><td style="text-align:right">GH&#8373; ${(total / orders.length).toFixed(2)}</td></tr>` : ''}
  </table>
  <div class="dashed"></div>
  <div class="section-title">PAYMENT BREAKDOWN</div>
  <table>${payRows || '<tr><td colspan="2">No sales</td></tr>'}</table>
  ${topItems.length > 0 ? `
  <div class="dashed"></div>
  <div class="section-title">ITEMS SOLD</div>
  <table>${itemRows}</table>` : ''}
  <div class="dashed"></div>
  <div class="center" style="font-size:10px;color:#666">End of shift report<br>Thank you, ${cashierName}!</div>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const cleanup = () => { try { document.body.removeChild(iframe); } catch {} };

    iframe.onload = () => {
      try {
        const w = iframe.contentWindow;
        if (!w) { cleanup(); return; }
        w.focus();
        w.print();
        setTimeout(cleanup, 2000);
      } catch {
        cleanup();
      }
    };

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) { cleanup(); alert('Unable to open summary for printing.'); return; }
    doc.open();
    doc.write(html);
    doc.close();
  }

  const statCard = (label: string, value: string, sub?: string) => (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 14px', flex: 1 }}>
      <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>{label}</div>
      <div style={{ fontFamily: 'Syne', fontSize: '20px', fontWeight: 800, color: 'var(--gold)' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '22px', padding: '24px', width: '100%', maxWidth: '520px', maxHeight: '92vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'Syne', fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>Shift Summary</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{cashierName} &mdash; {fmt(shiftStart)} &rarr; {fmt(now)}</div>
          <div style={{ display: 'inline-block', marginTop: '8px', background: 'rgba(240,192,64,.1)', border: '1px solid rgba(240,192,64,.2)', borderRadius: '20px', padding: '3px 12px', fontSize: '12px', color: 'var(--gold)', fontWeight: 700 }}>Duration: {duration}</div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          {statCard('Orders', orders.length.toString())}
          {statCard('Revenue', `GH₵${total.toFixed(2)}`)}
          {statCard('Avg Order', orders.length ? `GH₵${(total / orders.length).toFixed(2)}` : 'N/A')}
        </div>

        {/* Payment breakdown */}
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px', marginBottom: '14px' }}>
          <div style={{ fontFamily: 'Syne', fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--text2)' }}>Payment Breakdown</div>
          {[
            { label: 'Cash', icon: '💵', value: byPay.Cash },
            { label: 'MoMo', icon: '📱', value: byPay.MoMo },
            { label: 'Card', icon: '💳', value: byPay.Card },
          ].map(p => (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span>{p.icon}</span><span>{p.label}</span>
              </div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '14px', color: p.value > 0 ? 'var(--gold)' : 'var(--text3)' }}>
                GH₵ {p.value.toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Top items */}
        {topItems.length > 0 && (
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px', marginBottom: '14px' }}>
            <div style={{ fontFamily: 'Syne', fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--text2)' }}>Items Sold This Shift</div>
            {topItems.map(([name, qty], i) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '5px 0', borderBottom: i < topItems.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--gold)', color: 'var(--bg)', fontFamily: 'Syne', fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1, fontSize: '13px', fontWeight: 600 }}>{name}</div>
                <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 700 }}>{qty} sold</div>
              </div>
            ))}
          </div>
        )}

        {orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text3)', fontSize: '13px', marginBottom: '14px' }}>No orders taken this shift</div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose}
            style={{ flex: 1, background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', fontFamily: 'Syne', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            Keep Working
          </button>
          <button onClick={printSummary}
            style={{ flex: 1, background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', fontFamily: 'Syne', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            Print Summary
          </button>
          <button onClick={onEndShift}
            style={{ flex: 1, background: 'var(--red)', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontFamily: 'Syne', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
            End Shift & Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
