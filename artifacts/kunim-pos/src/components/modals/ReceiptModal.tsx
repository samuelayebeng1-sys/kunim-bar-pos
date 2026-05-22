import { Order } from '../../lib/types';

interface Props {
  order: Order;
  onClose: () => void;
}

export default function ReceiptModal({ order, onClose }: Props) {
  const now = new Date();

  const dateStr = now.toLocaleDateString('en-GB');
  const timeStr = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  function truncate(str: string, max: number) {
    return str.length > max ? str.substring(0, max) : str;
  }

  function buildReceiptHTML(): string {
    const rows = order.items
      .map((item) => {
        const name = truncate(item.name, 16);
        const amount = `GH₵ ${(item.price * item.qty).toFixed(2)}`;

        return `
          <tr>
            <td class="item-name">${name} x${item.qty}</td>
            <td class="item-amt">${amount}</td>
          </tr>
        `;
      })
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt</title>
  <style>
    @page {
      size: 58mm auto;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html,
    body {
      width: 58mm;
      background: #ffffff;
      color: #000000;
    }

    body {
      font-family: "Courier New", Courier, monospace;
      font-size: 11px;
      line-height: 1.55;
      padding: 0;
      margin: 0;
    }

    .receipt {
      width: 54mm;
      padding: 3mm 2mm;
      margin: 0 auto;
      background: #ffffff;
      color: #000000;
    }

    .center {
      text-align: center;
    }

    .business {
      font-size: 13px;
      font-weight: bold;
      letter-spacing: 0.3px;
    }

    .small {
      font-size: 9px;
      color: #555555;
      margin-top: 1px;
    }

    .meta {
      font-size: 10px;
      margin-top: 2px;
    }

    .dash {
      border-top: 1px dashed #000000;
      margin: 7px 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    td {
      padding: 1px 0;
      vertical-align: top;
    }

    .item-name {
      text-align: left;
      word-break: break-word;
      padding-right: 4px;
    }

    .item-amt {
      text-align: right;
      white-space: nowrap;
    }

    .total td {
      font-size: 13px;
      font-weight: bold;
      padding-top: 4px;
    }

    .payment td {
      font-size: 11px;
      padding-top: 1px;
    }

    .footer {
      text-align: center;
      font-size: 9px;
      color: #555555;
      margin-top: 2px;
    }

    @media print {
      html,
      body {
        width: 58mm !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .receipt {
        width: 54mm !important;
        margin: 0 auto !important;
        padding: 3mm 2mm !important;
      }

      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="center">
      <div class="business">Kunim Guest House Bar</div>
      <div class="small">Powered by ChalePay</div>
      <div class="meta">${dateStr} ${timeStr}</div>
      <div class="meta">Cashier: <strong>${order.cashier}</strong></div>
    </div>

    <div class="dash"></div>

    <table>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="dash"></div>

    <table>
      <tbody>
        <tr class="total">
          <td>TOTAL</td>
          <td style="text-align:right;">GH₵ ${order.total.toFixed(2)}</td>
        </tr>
        <tr class="payment">
          <td>Payment</td>
          <td style="text-align:right;">${order.paymentMethod}</td>
        </tr>
      </tbody>
    </table>

    <div class="dash"></div>

    <div class="footer">
      <div>Thank you for visiting!</div>
      <div>Come again soon ♥</div>
    </div>
  </div>
</body>
</html>
`;
  }

  function printReceipt() {
    const iframe = document.createElement('iframe');

    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.setAttribute('aria-hidden', 'true');

    document.body.appendChild(iframe);

    const cleanup = () => {
      try {
        document.body.removeChild(iframe);
      } catch {}
    };

    const doc = iframe.contentDocument || iframe.contentWindow?.document;

    if (!doc) {
      cleanup();
      alert('Unable to prepare receipt for printing.');
      return;
    }

    doc.open();
    doc.write(buildReceiptHTML());
    doc.close();

    iframe.onload = () => {
      const win = iframe.contentWindow;

      if (!win) {
        cleanup();
        return;
      }

      setTimeout(() => {
        win.focus();
        win.print();
        setTimeout(cleanup, 3000);
      }, 400);
    };
  }

  const previewRows = order.items.map((item, index) => (
    <tr key={index}>
      <td
        style={{
          textAlign: 'left',
          verticalAlign: 'top',
          padding: '1px 4px 1px 0',
          wordBreak: 'break-word',
        }}
      >
        {truncate(item.name, 16)} x{item.qty}
      </td>
      <td
        style={{
          textAlign: 'right',
          verticalAlign: 'top',
          padding: '1px 0',
          whiteSpace: 'nowrap',
        }}
      >
        GH₵ {(item.price * item.qty).toFixed(2)}
      </td>
    </tr>
  ));

  const receiptStyle: React.CSSProperties = {
    background: '#ffffff',
    color: '#000000',
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '11px',
    lineHeight: '1.55',
    width: '216px',
    margin: '0 auto',
    padding: '12px 8px',
    borderRadius: '8px',
  };

  const dashStyle: React.CSSProperties = {
    borderTop: '1px dashed #000',
    margin: '7px 0',
  };

  return (
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

        <div style={receiptStyle}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 'bold',
                letterSpacing: '0.3px',
              }}
            >
              Kunim Guest House Bar
            </div>
            <div style={{ fontSize: '9px', color: '#555', marginTop: '1px' }}>
              Powered by ChalePay
            </div>
            <div style={{ fontSize: '10px', marginTop: '2px' }}>
              {dateStr} {timeStr}
            </div>
            <div style={{ fontSize: '10px' }}>
              Cashier: <strong>{order.cashier}</strong>
            </div>
          </div>

          <div style={dashStyle} />

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>{previewRows}</tbody>
          </table>

          <div style={dashStyle} />

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td
                  style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    paddingTop: '4px',
                  }}
                >
                  TOTAL
                </td>
                <td
                  style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    textAlign: 'right',
                    paddingTop: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  GH₵ {order.total.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td style={{ fontSize: '11px', paddingTop: '1px' }}>
                  Payment
                </td>
                <td
                  style={{
                    fontSize: '11px',
                    textAlign: 'right',
                    paddingTop: '1px',
                  }}
                >
                  {order.paymentMethod}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={dashStyle} />

          <div
            style={{
              textAlign: 'center',
              fontSize: '9px',
              color: '#555',
              marginTop: '2px',
            }}
          >
            <div>Thank you for visiting!</div>
            <div>Come again soon ♥</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button
            onClick={printReceipt}
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
            🖨️ Print Receipt
          </button>

          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: 'var(--gold)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
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
    </div>
  );
}