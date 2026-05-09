import { Order } from '../../lib/types';

interface Props {
  order: Order;
  onClose: () => void;
}

export default function ReceiptModal({ order, onClose }: Props) {
  const now = new Date();

  function printReceipt() {
    const el = document.getElementById('thermalPrint');
    if (!el) return;
    el.innerHTML = `
      <div style="width:72mm;font-family:'Courier New',monospace;font-size:11px;line-height:1.6;padding:3mm 2mm;">
        <div style="text-align:center;border-bottom:1px dashed #000;padding-bottom:3mm;margin-bottom:3mm;">
          <div style="font-size:14px;font-weight:bold;">Kunim Guest House Bar</div>
          <div style="font-size:10px;">Powered by ChalePay</div>
          <div>${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
          <div>Cashier: ${order.cashier}</div>
          <div>Customer: ${order.customer}</div>
          <div>Table: ${order.table}</div>
        </div>
        ${order.items.map(i => `<div style="display:flex;justify-content:space-between;"><span>${i.name} x${i.qty}</span><span>GH₵${(i.price * i.qty).toFixed(2)}</span></div>`).join('')}
        <div style="border-top:1px dashed #000;margin-top:3mm;padding-top:2mm;">
          <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:13px;"><span>TOTAL</span><span>GH₵${order.total.toFixed(2)}</span></div>
          <div>Payment: ${order.paymentMethod}</div>
        </div>
        <div style="text-align:center;border-top:1px dashed #000;margin-top:3mm;padding-top:2mm;font-size:10px;">Thank you! Come again soon.</div>
      </div>`;
    window.print();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '460px', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: 700, marginBottom: '18px' }}>Receipt</div>

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

        <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
          <button onClick={printReceipt} style={{ flex: 1, background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', fontFamily: 'Syne', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Print Receipt</button>
          <button onClick={onClose} style={{ flex: 1, background: 'var(--gold)', color: 'var(--bg)', border: 'none', borderRadius: '10px', padding: '12px', fontFamily: 'Syne', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>New Order</button>
        </div>
      </div>
    </div>
  );
}
