import { Order } from '../../lib/types';

interface Props {
  order: Order;
  onClose: () => void;
}

export default function ReceiptModal({ order, onClose }: Props) {
  const now = new Date();

  function printReceipt() {
    const win = window.open('', '_blank', 'width=420,height=680,toolbar=0,scrollbars=0,status=0');
    if (!win) { alert('Pop-up blocked — please allow pop-ups for this site and try again.'); return; }

    const rows = order.items.map(i => `
      <tr>
        <td style="padding:2px 0">${i.name} x${i.qty}</td>
        <td style="padding:2px 0;text-align:right">GH&#8373; ${(i.price * i.qty).toFixed(2)}</td>
      </tr>`).join('');

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt — Kunim Guest House Bar</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 72mm; padding: 4mm 3mm; color: #000; background: #fff; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .big { font-size: 15px; }
    .small { font-size: 10px; color: #555; }
    .dashed { border-top: 1px dashed #000; margin: 4mm 0; }
    table { width: 100%; border-collapse: collapse; }
    .total-row td { font-size: 14px; font-weight: bold; padding-top: 3mm; }
    .footer { margin-top: 3mm; text-align: center; font-size: 10px; color: #666; }
  </style>
</head>
<body>
  <div class="center">
    <div class="bold big">Kunim Guest House Bar</div>
    <div class="small">Powered by ChalePay</div>
    <div>${now.toLocaleDateString('en-GB')} &nbsp; ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
    <div>Cashier: <strong>${order.cashier}</strong></div>
    ${order.customer !== 'Walk-in' ? `<div>Customer: ${order.customer}</div>` : ''}
    ${order.table !== '-' ? `<div>Table / Room: ${order.table}</div>` : ''}
  </div>
  <div class="dashed"></div>
  <table>${rows}</table>
  <div class="dashed"></div>
  <table>
    <tr class="total-row">
      <td>TOTAL</td>
      <td style="text-align:right">GH&#8373; ${order.total.toFixed(2)}</td>
    </tr>
    <tr>
      <td>Payment</td>
      <td style="text-align:right">${order.paymentMethod}</td>
    </tr>
  </table>
  <div class="dashed"></div>
  <div class="footer">
    <div>Thank you for visiting!</div>
    <div>Come again soon &#9829;</div>
  </div>
  <script>
    window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 1000); };
  <\/script>
</body>
</html>`);
    win.document.close();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '460px', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: 700, marginBottom: '18px' }}>Receipt</div>

        {/* Receipt preview */}
        <div style={{ background: '#fff', color: '#000', borderRadius: '12px', padding: '16px', fontFamily: "'Courier New', monospace", fontSize: '12px', lineHeight: '1.7', maxWidth: '300px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed #ccc' }}>
            <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '2px' }}>Kunim Guest House Bar</div>
            <div style={{ fontSize: '11px', color: '#555' }}>Powered by ChalePay</div>
            <div>{now.toLocaleDateString('en-GB')} {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
            <div>Cashier: {order.cashier} | Table: {order.table}</div>
            <div>Customer: {order.customer}</div>
          </div>
          <div style={{ marginBottom: '8px' }}>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>{item.name} x{item.qty}</span>
                <span>GH₵ {(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px dashed #ccc', paddingTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
              <span>TOTAL</span><span>GH₵ {order.total.toFixed(2)}</span>
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Payment: {order.paymentMethod}</div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '10px', borderTop: '1px dashed #ccc', paddingTop: '10px', fontSize: '11px', color: '#888' }}>
            <p>Thank you for visiting!</p><p>Come again soon</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button onClick={printReceipt}
            style={{ flex: 1, background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', fontFamily: 'Syne', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            Print Receipt
          </button>
          <button onClick={onClose}
            style={{ flex: 1, background: 'var(--gold)', color: 'var(--bg)', border: 'none', borderRadius: '10px', padding: '12px', fontFamily: 'Syne', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
            New Order
          </button>
        </div>
      </div>
    </div>
  );
}
