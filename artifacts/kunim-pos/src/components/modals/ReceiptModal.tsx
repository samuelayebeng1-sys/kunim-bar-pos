import { Order } from '../../lib/types';

interface Props {
  order: Order;
  onClose: () => void;
}

const LINE_WIDTH = 32;
const DOTS = '................................';

function centerText(text: string, width = LINE_WIDTH): string {
  const clean = text.substring(0, width);
  const left = Math.floor((width - clean.length) / 2);
  return ' '.repeat(Math.max(0, left)) + clean;
}

function twoCol(left: string, right: string, width = LINE_WIDTH): string {
  const maxLeft = Math.max(1, width - right.length - 1);
  const safeLeft = left.substring(0, maxLeft);
  return safeLeft.padEnd(maxLeft) + ' ' + right;
}

function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

function buildPlainReceipt(order: Order, now: Date): string {
  const dateStr = now.toLocaleDateString('en-GB');
  const timeStr = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const lines: string[] = [];

  lines.push(centerText('Kunim Guest House Bar'));
  lines.push(centerText('Powered by ChalePay'));
  lines.push(centerText(`${dateStr} ${timeStr}`));
  lines.push(centerText(`Cashier: ${order.cashier}`));
  lines.push(DOTS);

  order.items.forEach((item) => {
    const name = item.name.substring(0, 18);
    const left = `${name} x${item.qty}`;
    const right = `GHC ${(item.price * item.qty).toFixed(2)}`;
    lines.push(twoCol(left, right));
  });

  lines.push(DOTS);
  lines.push(twoCol('TOTAL', `GHC ${order.total.toFixed(2)}`));
  lines.push(twoCol('Payment', order.paymentMethod));
  lines.push(DOTS);
  lines.push(centerText('Thank you for visiting!'));
  lines.push(centerText('Come again soon <3'));

  return lines.join('\n');
}

function openRawBT(text: string) {
  const encoded = encodeURIComponent(text);
  window.location.href = `rawbt://print?text=${encoded}`;
}

export default function ReceiptModal({ order, onClose }: Props) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB');
  const timeStr = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const receiptText = buildPlainReceipt(order, now);
  const android = isAndroid();

  function handlePrint() {
    if (android) {
      openRawBT(receiptText);
      return;
    }

    window.print();
  }

  function handleSaveAsPDF() {
    window.print();
  }

  const previewItems = order.items.map((item, index) => (
    <div
      key={index}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '8px',
        fontSize: '11px',
        lineHeight: '1.55',
        padding: '1px 0',
      }}
    >
      <span style={{ wordBreak: 'break-word' }}>
        {item.name.substring(0, 18)} x{item.qty}
      </span>
      <span style={{ whiteSpace: 'nowrap' }}>
        GH₵ {(item.price * item.qty).toFixed(2)}
      </span>
    </div>
  ));

  return (
    <>
      <style>
        {`
          @page {
            size: 58mm auto;
            margin: 0;
          }

          @media print {
            body * {
              visibility: hidden !important;
            }

            #receipt-print-area,
            #receipt-print-area * {
              visibility: visible !important;
            }

            #receipt-print-area {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 58mm !important;
              background: white !important;
              color: black !important;
              padding: 3mm 2mm !important;
              margin: 0 !important;
            }

            #receipt-print-area pre {
              font-family: "Courier New", monospace !important;
              font-size: 10.5px !important;
              line-height: 1.5 !important;
              white-space: pre !important;
              color: black !important;
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `}
      </style>

      <div
        id="receipt-print-area"
        style={{
          display: 'none',
        }}
      >
        <pre>{receiptText}</pre>
      </div>

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
          <div
            style={{
              fontFamily: 'Syne',
              fontSize: '18px',
              fontWeight: 700,
              marginBottom: '18px',
            }}
          >
            Receipt
          </div>

          <div
            style={{
              background: '#fff',
              color: '#000',
              borderRadius: '10px',
              padding: '12px 10px',
              width: '224px',
              margin: '0 auto',
              fontFamily: "'Courier New', monospace",
              fontSize: '11px',
              lineHeight: '1.55',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                Kunim Guest House Bar
              </div>
              <div style={{ fontSize: '9px', color: '#666' }}>
                Powered by ChalePay
              </div>
              <div style={{ fontSize: '10px' }}>
                {dateStr} {timeStr}
              </div>
              <div style={{ fontSize: '10px' }}>
                Cashier: <strong>{order.cashier}</strong>
              </div>
            </div>

            <div style={{ fontSize: '10px', color: '#777', margin: '6px 0' }}>
              {DOTS}
            </div>

            {previewItems}

            <div style={{ fontSize: '10px', color: '#777', margin: '6px 0' }}>
              {DOTS}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                fontWeight: 'bold',
              }}
            >
              <span>TOTAL</span>
              <span>GH₵ {order.total.toFixed(2)}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '2px',
              }}
            >
              <span>Payment</span>
              <span>{order.paymentMethod}</span>
            </div>

            <div style={{ fontSize: '10px', color: '#777', margin: '6px 0' }}>
              {DOTS}
            </div>

            <div style={{ textAlign: 'center', fontSize: '9px', color: '#666' }}>
              <div>Thank you for visiting!</div>
              <div>Come again soon ♥</div>
            </div>
          </div>

          {android && (
            <div
              style={{
                marginTop: '10px',
                fontSize: '11px',
                color: 'var(--text)',
                opacity: 0.6,
                textAlign: 'center',
                fontFamily: 'Syne',
              }}
            >
              RawBT must be installed and paired with the printer.
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
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