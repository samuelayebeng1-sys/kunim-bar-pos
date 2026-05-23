bash

cat > /mnt/user-data/outputs/ReceiptModal.tsx << 'ENDOFFILE'
import { Order } from '../../lib/types';

interface Props {
  order: Order;
  onClose: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LINE_WIDTH = 32;
const DOTS = '................................';  // 32 chars – prints on all output types
const DASHES = '--------------------------------';  // 32 chars

// ─── ESC/POS byte constants ──────────────────────────────────────────────────

const ESC = 0x1b;
const GS  = 0x1d;
const LF  = 0x0a;

const CMD_INIT         = [ESC, 0x40];
const CMD_ALIGN_CENTER = [ESC, 0x61, 0x01];
const CMD_ALIGN_LEFT   = [ESC, 0x61, 0x00];
const CMD_BOLD_ON      = [ESC, 0x45, 0x01];
const CMD_BOLD_OFF     = [ESC, 0x45, 0x00];
const CMD_FONT_SMALL   = [ESC, 0x4d, 0x01];
const CMD_FONT_NORMAL  = [ESC, 0x4d, 0x00];
const CMD_DOUBLE_ON    = [GS,  0x21, 0x11];
const CMD_DOUBLE_OFF   = [GS,  0x21, 0x00];
const CMD_CUT          = [GS,  0x56, 0x42, 0x00];

// ─── Text helpers ────────────────────────────────────────────────────────────

function centerText(str: string, width = LINE_WIDTH): string {
  const s = str.substring(0, width);
  const spaces = Math.max(0, Math.floor((width - s.length) / 2));
  return ' '.repeat(spaces) + s;
}

function twoCol(left: string, right: string, width = LINE_WIDTH): string {
  const maxLeft = width - right.length - 1;
  const l = left.substring(0, maxLeft).padEnd(maxLeft);
  return `${l} ${right}`;
}

function encodeText(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c === 0x20b5 || c === 0x00a2) { bytes.push(0x43); } // ₵ → C
    else if (c < 128) { bytes.push(c); }
    else { bytes.push(0x3f); } // ? for unmapped
  }
  return bytes;
}

function escLine(text: string): number[] {
  return [...encodeText(text), LF];
}

// ─── Platform detection ───────────────────────────────────────────────────────

function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

// ─── ESC/POS receipt builder ─────────────────────────────────────────────────

function buildEscPos(order: Order, now: Date): Uint8Array {
  const dateStr = now.toLocaleDateString('en-GB');
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const bytes: number[] = [
    ...CMD_INIT,

    // Header
    ...CMD_ALIGN_CENTER,
    ...CMD_BOLD_ON,
    ...CMD_DOUBLE_ON,
    ...escLine('Kunim'),
    ...escLine('Guest House Bar'),
    ...CMD_DOUBLE_OFF,
    ...CMD_BOLD_OFF,
    ...CMD_FONT_SMALL,
    ...escLine(centerText('Powered by ChalePay')),
    ...CMD_FONT_NORMAL,
    ...escLine(centerText(`${dateStr}  ${timeStr}`)),
    ...escLine(centerText(`Cashier: ${order.cashier}`)),

    ...CMD_ALIGN_LEFT,
    ...escLine(DOTS),

    // Items
    ...order.items.flatMap(item => {
      const name = item.name.substring(0, 20);
      const qty  = `x${item.qty}`;
      const amt  = `GHC ${(item.price * item.qty).toFixed(2)}`;
      return escLine(twoCol(`${name} ${qty}`, amt));
    }),

    ...escLine(DOTS),

    // Total
    ...CMD_BOLD_ON,
    ...escLine(twoCol('TOTAL', `GHC ${order.total.toFixed(2)}`)),
    ...CMD_BOLD_OFF,
    ...escLine(twoCol('Payment', order.paymentMethod)),

    ...escLine(DOTS),

    // Footer
    ...CMD_ALIGN_CENTER,
    ...CMD_FONT_SMALL,
    ...escLine(centerText('Thank you for visiting!')),
    ...escLine(centerText('Come again soon <3')),
    ...CMD_FONT_NORMAL,
    [LF, LF, LF],

    ...CMD_CUT,
  ].flat();

  return new Uint8Array(bytes);
}

// ─── RawBT deep-link print ───────────────────────────────────────────────────

function printRawBT(order: Order, now: Date): void {
  const bytes = buildEscPos(order, now);
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  const b64 = btoa(binary);

  const url = `rawbt://print?base64=${encodeURIComponent(b64)}`;
  const a = document.createElement('a');
  a.href = url;
  a.style.display = 'none';
  document.body.appendChild(a);
  try { a.click(); } finally {
    setTimeout(() => { try { document.body.removeChild(a); } catch { /* gone */ } }, 2000);
  }
}

// ─── Build the plain-text receipt body (used for visible print container) ────

function buildPlainTextReceipt(order: Order, now: Date): string {
  const dateStr = now.toLocaleDateString('en-GB');
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const lines: string[] = [];

  lines.push(centerText('Kunim Guest House Bar'));
  lines.push(centerText('Powered by ChalePay'));
  lines.push(centerText(`${dateStr}  ${timeStr}`));
  lines.push(centerText(`Cashier: ${order.cashier}`));
  lines.push(DOTS);

  order.items.forEach(item => {
    const name = item.name.substring(0, 20);
    const qty  = `x${item.qty}`;
    const amt  = `GHC ${(item.price * item.qty).toFixed(2)}`;
    lines.push(twoCol(`${name} ${qty}`, amt));
  });

  lines.push(DOTS);
  lines.push(twoCol('TOTAL', `GHC ${order.total.toFixed(2)}`));
  lines.push(twoCol('Payment', order.paymentMethod));
  lines.push(DOTS);
  lines.push(centerText('Thank you for visiting!'));
  lines.push(centerText('Come again soon <3'));

  return lines.join('\n');
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReceiptModal({ order, onClose }: Props) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB');
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const android = isAndroid();

  // Inject print styles once into <head> on mount (avoids styled-components dep)
  if (typeof document !== 'undefined' && !document.getElementById('receipt-print-style')) {
    const style = document.createElement('style');
    style.id = 'receipt-print-style';
    style.textContent = `
      @page {
        size: 58mm auto;
        margin: 0;
      }
      @media print {
        /* Hide everything on the page */
        body > *,
        body > * > *,
        #__next > * {
          display: none !important;
        }

        /* Show ONLY the print receipt container */
        #receipt-print-container {
          display: block !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 58mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #fff !important;
          color: #000 !important;
          z-index: 9999999 !important;
        }

        #receipt-print-container pre {
          font-family: 'Courier New', Courier, monospace !important;
          font-size: 10.5px !important;
          line-height: 1.5 !important;
          white-space: pre !important;
          word-break: keep-all !important;
          overflow: hidden !important;
          width: 58mm !important;
          margin: 0 !important;
          padding: 3mm 2mm !important;
          background: #fff !important;
          color: #000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function handlePrint() {
    if (android) {
      // On Android: use RawBT deep link (ESC/POS bytes)
      printRawBT(order, now);
    } else {
      // Desktop: use window.print() — the #receipt-print-container is shown via @media print
      window.print();
    }
  }

  function handleSaveAsPDF() {
    // window.print() with "Save as PDF" works cross-platform
    // On Android Chrome, user selects "Save as PDF" in the print dialog
    window.print();
  }

  // ── Preview card rows ─────────────────────────────────────────────────────

  const previewItems = order.items.map((item, i) => (
    <div
      key={i}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: '11px',
        lineHeight: '1.55',
        padding: '1px 0',
      }}
    >
      <span style={{ wordBreak: 'break-word', paddingRight: '6px' }}>
        {item.name.substring(0, 18)} x{item.qty}
      </span>
      <span style={{ whiteSpace: 'nowrap' }}>
        GH₵ {(item.price * item.qty).toFixed(2)}
      </span>
    </div>
  ));

  const monoStyle: React.CSSProperties = {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: '11px',
    lineHeight: '1.55',
  };

  const dotLine: React.CSSProperties = {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: '10px',
    color: '#888',
    letterSpacing: '0.5px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    margin: '5px 0',
  };

  // ── Plain text for print container ────────────────────────────────────────

  const plainText = buildPlainTextReceipt(order, now);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Hidden print-safe container (visible ONLY during print/PDF) ── */}
      {/*    Positioned off-screen when not printing; @media print reveals it */}
      <div
        id="receipt-print-container"
        style={{ display: 'none' }}
        aria-hidden="true"
      >
        <pre>{plainText}</pre>
      </div>

      {/* ── Modal overlay ── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
        }}
      >
        <div
          style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            maxWidth: '460px',
            maxHeight: '92vh',
            overflowY: 'auto',
          }}
        >
          {/* Title */}
          <div style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: 700, marginBottom: '18px' }}>
            Receipt
          </div>

          {/* ── On-screen preview card ── */}
          <div
            style={{
              background: '#fff',
              color: '#000',
              borderRadius: '10px',
              padding: '12px 10px',
              width: '224px',
              margin: '0 auto',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', ...monoStyle }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '.3px' }}>
                Kunim Guest House Bar
              </div>
              <div style={{ fontSize: '9px', color: '#666', marginTop: '1px' }}>
                Powered by ChalePay
              </div>
              <div style={{ fontSize: '10px', marginTop: '2px' }}>
                {dateStr}  {timeStr}
              </div>
              <div style={{ fontSize: '10px' }}>
                Cashier: <strong>{order.cashier}</strong>
              </div>
            </div>

            {/* Separator */}
            <div style={dotLine}>{DOTS}</div>

            {/* Items */}
            <div>{previewItems}</div>

            {/* Separator */}
            <div style={dotLine}>{DOTS}</div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', ...monoStyle, fontWeight: 'bold', fontSize: '13px' }}>
              <span>TOTAL</span>
              <span>GH₵ {order.total.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', ...monoStyle, marginTop: '2px' }}>
              <span>Payment</span>
              <span>{order.paymentMethod}</span>
            </div>

            {/* Separator */}
            <div style={dotLine}>{DOTS}</div>

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: '9px', color: '#666', ...monoStyle }}>
              <div>Thank you for visiting!</div>
              <div>Come again soon ♥</div>
            </div>
          </div>

          {/* Android hint */}
          {android && (
            <div style={{
              marginTop: '10px',
              fontSize: '11px',
              color: 'var(--text)',
              opacity: 0.55,
              textAlign: 'center',
              fontFamily: 'Syne',
            }}>
              RawBT must be installed &amp; Bluetooth printer paired
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
            {/* Print / RawBT button */}
            <button
              onClick={handlePrint}
              style={{
                flex: 1,
                background: 'var(--bg3)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '12px',
                fontFamily: 'Syne',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {android ? '🖨️ Print via RawBT' : '🖨️ Print Receipt'}
            </button>

            {/* Save as PDF (both platforms) */}
            <button
              onClick={handleSaveAsPDF}
              style={{
                flex: 1,
                background: 'var(--bg3)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '12px',
                fontFamily: 'Syne',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              💾 Save as PDF
            </button>
          </div>

          {/* New Order */}
          <button
            onClick={onClose}
            style={{
              width: '100%',
              marginTop: '10px',
              background: 'var(--gold)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: '10px',
              padding: '13px',
              fontFamily: 'Syne',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            New Order
          </button>
        </div>
      </div>
    </>
  );
}