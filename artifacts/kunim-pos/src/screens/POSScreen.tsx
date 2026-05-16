import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import TopNav from '../components/TopNav';
import ReceiptModal from '../components/modals/ReceiptModal';
import { Order } from '../lib/types';

interface Props {
  onEndShift: () => void;
}

export default function POSScreen({ onEndShift }: Props) {
  const { menuItems, categories, cart, addToCart, updateQty, selectedPayment, setSelectedPayment, processOrder } = useApp();
  const [searchQ, setSearchQ] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [charging, setCharging] = useState(false);
  const [receipt, setReceipt] = useState<Order | null>(null);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [printerName, setPrinterName] = useState('');

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  function getFilteredItems() {
    let items = menuItems;
    if (activeCat !== 'All') items = items.filter(i => i.category === activeCat);
    if (searchQ) items = items.filter(i => i.name.toLowerCase().includes(searchQ.toLowerCase()));
    return items;
  }

  async function handleCharge() {
    if (!cart.length) return;
    setCharging(true);
    try {
      const order = await processOrder();
      if (order) {
        setReceipt(order);
      }
    } catch {
      alert('Error saving order. Check your internet connection.');
    } finally {
      setCharging(false);
    }
  }

  async function connectPrinter() {
    if (!(navigator as any).bluetooth) { alert('Bluetooth printing requires Chrome on Android.'); return; }
    try {
      const device = await (navigator as any).bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'] });
      await device.gatt.connect();
      setPrinterConnected(true);
      setPrinterName(device.name || 'Printer');
    } catch {}
  }

  const payMethods: Array<{ id: 'Cash' | 'MoMo' | 'Card'; icon: string; label: string }> = [
    { id: 'Cash', icon: '💵', label: 'Cash' },
    { id: 'MoMo', icon: '📱', label: 'MoMo' },
    { id: 'Card', icon: '💳', label: 'Card' },
  ];

  const filtered = getFilteredItems();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopNav activeTab="pos" onEndShift={onEndShift} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', flex: 1, overflow: 'hidden', height: 'calc(100vh - 56px)' }}>

        {/* Menu Side */}
        <div style={{ overflowY: 'auto', padding: '14px', background: 'var(--bg)' }}>
          {/* Printer bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, fontFamily: 'Syne, sans-serif', marginBottom: '12px', border: '1px solid', background: printerConnected ? 'rgba(34,197,94,.08)' : 'rgba(224,16,16,.08)', borderColor: printerConnected ? 'rgba(34,197,94,.2)' : 'rgba(224,16,16,.2)', color: printerConnected ? 'var(--success)' : 'var(--red)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: printerConnected ? 'var(--success)' : 'var(--red)', flexShrink: 0 }} />
            <span>{printerConnected ? `Connected: ${printerName}` : 'Printer not connected'}</span>
            {!printerConnected && (
              <button onClick={connectPrinter} style={{ marginLeft: 'auto', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '7px', padding: '4px 10px', fontSize: '11px', color: 'var(--text2)', fontWeight: 700, cursor: 'pointer' }}>Connect</button>
            )}
          </div>

          {/* Search */}
          <input
            value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Search items..."
            style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '11px 14px', color: 'var(--text)', fontSize: '14px', outline: 'none', marginBottom: '12px' }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--gold)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
          />

          {/* Categories */}
          <div style={{ display: 'flex', gap: '7px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '2px' }}>
            {['All', ...categories.map(c => c.name)].map(name => (
              <button key={name} onClick={() => setActiveCat(name)} style={{ background: activeCat === name ? 'var(--gold)' : 'var(--bg2)', border: `1px solid ${activeCat === name ? 'var(--gold)' : 'var(--border)'}`, borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, color: activeCat === name ? 'var(--bg)' : 'var(--text2)', whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
                {name}
              </button>
            ))}
          </div>

          {/* Menu Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
            {filtered.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 16px', color: 'var(--text3)' }}>No items found</div>
            ) : filtered.map(item => (
              <div
                key={item.id}
                onClick={() => item.stock > 0 && addToCart(item)}
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', cursor: item.stock <= 0 ? 'not-allowed' : 'pointer', transition: 'all .2s', opacity: item.stock <= 0 ? 0.4 : 1, position: 'relative' }}
                onMouseEnter={e => { if (item.stock > 0) { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {item.stock > 0 && item.stock <= 5 && (
                  <div style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(224,16,16,.85)', borderRadius: '6px', padding: '2px 6px', fontSize: '10px', color: '#fff', fontWeight: 700, zIndex: 1 }}>Low</div>
                )}
                {item.photo ? (
                  <div style={{ width: '100%', height: '96px', overflow: 'hidden' }}>
                    <img src={item.photo} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '96px', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: 'var(--text3)' }}>🍺</div>
                )}
                <div style={{ padding: '9px 10px' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '12px', fontWeight: 700, marginBottom: '3px', lineHeight: '1.3' }}>{item.name}</div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 800, color: 'var(--gold)' }}>GH₵ {item.price.toFixed(2)}</div>
                  <div style={{ fontSize: '11px', color: item.stock <= 5 && item.stock > 0 ? 'var(--warning)' : 'var(--text3)', marginTop: '2px' }}>
                    {item.stock <= 0 ? 'Out of stock' : `Stock: ${item.stock}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Side */}
        <div style={{ background: 'var(--bg2)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '13px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700 }}>Current Order</div>
          </div>

          {/* Cart */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text3)', fontSize: '13px' }}>
                Tap items from the menu to add them here
              </div>
            ) : cart.map(item => (
              <div key={item.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {item.photo ? (
                  <img src={item.photo} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, color: 'var(--text3)' }}>🍺</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 600 }}>GH₵ {item.price.toFixed(2)} each</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <button onClick={() => updateQty(item.id, -1)} style={{ width: '26px', height: '26px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--bg4)', color: 'var(--text)', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>−</button>
                  <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '18px', textAlign: 'center' }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} style={{ width: '26px', height: '26px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--bg4)', color: 'var(--text)', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>+</button>
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 800, minWidth: '54px', textAlign: 'right' }}>GH₵ {(item.price * item.qty).toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: '13px', borderTop: '1px solid var(--border)' }}>
            <div style={{ marginBottom: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text2)', marginBottom: '5px' }}>
                <span>Subtotal</span><span>GH₵ {total.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Syne, sans-serif', fontSize: '19px', fontWeight: 800, color: 'var(--gold)', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                <span>Total</span><span>GH₵ {total.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px', marginBottom: '11px' }}>
              {payMethods.map(m => (
                <div key={m.id} onClick={() => setSelectedPayment(m.id)} style={{ background: selectedPayment === m.id ? 'rgba(240,192,64,.1)' : 'var(--bg3)', border: `2px solid ${selectedPayment === m.id ? 'var(--gold)' : 'var(--border)'}`, borderRadius: '10px', padding: '9px', textAlign: 'center', cursor: 'pointer', transition: 'all .2s' }}>
                  <div style={{ fontSize: '18px', marginBottom: '3px' }}>{m.icon}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: selectedPayment === m.id ? 'var(--gold)' : 'var(--text2)' }}>{m.label}</div>
                </div>
              ))}
            </div>

            <button
              onClick={handleCharge}
              disabled={!cart.length || charging}
              style={{ width: '100%', background: 'var(--gold)', color: 'var(--bg)', border: 'none', borderRadius: '13px', padding: '15px', fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 800, transition: 'all .2s', opacity: (!cart.length || charging) ? 0.4 : 1, cursor: (!cart.length || charging) ? 'not-allowed' : 'pointer' }}
            >
              {charging ? 'Saving...' : `Charge — GH₵ ${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {receipt && <ReceiptModal order={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
