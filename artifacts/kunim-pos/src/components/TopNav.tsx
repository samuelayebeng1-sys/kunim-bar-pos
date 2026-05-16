import { useApp } from '../contexts/AppContext';
import { Screen } from '../lib/types';
import logo from '../assets/kunim-logo.png';

interface Props {
  activeTab?: 'pos' | 'orders' | 'reports';
  isAdmin?: boolean;
  onEndShift?: () => void;
}

export default function TopNav({ activeTab, isAdmin, onEndShift }: Props) {
  const { currentCashier, setCurrentCashier, setScreen, setIsAdmin, setCart, shiftOrders } = useApp();

  function logout() {
    setCurrentCashier(null);
    setCart([]);
    setIsAdmin(false);
    setScreen('login');
  }

  function goTab(tab: 'pos' | 'orders' | 'reports') {
    setScreen(tab as Screen);
  }

  const tabStyle = (active: boolean) => ({
    padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 as const,
    border: 'none', background: active ? 'rgba(240,192,64,.1)' : 'transparent',
    color: active ? 'var(--gold)' : 'var(--text2)', transition: 'all .2s', fontFamily: 'Syne, sans-serif', cursor: 'pointer'
  });

  if (isAdmin) {
    return (
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src={logo} alt="Kunim" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.85)' }} />
          </div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '15px', color: 'var(--red)' }}>Admin Panel</div>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Kunim Bar</div>
        <button onClick={logout} style={{ background: 'rgba(224,16,16,.1)', border: '1px solid rgba(224,16,16,.2)', borderRadius: '8px', padding: '5px 11px', fontSize: '12px', color: 'var(--red)', fontWeight: 700, cursor: 'pointer' }}>Exit</button>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img src={logo} alt="Kunim" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.85)' }} />
        </div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '15px', color: 'var(--gold)' }}>
          Kunim Bar <small style={{ color: 'var(--text3)', fontWeight: 400, fontSize: '11px', marginLeft: '6px' }}>POS</small>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2px' }}>
        <button style={tabStyle(activeTab === 'pos')} onClick={() => goTab('pos')}>Menu</button>
        <button style={tabStyle(activeTab === 'orders')} onClick={() => goTab('orders')}>Today</button>
        <button style={tabStyle(activeTab === 'reports')} onClick={() => goTab('reports')}>Reports</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {currentCashier && (
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '20px', padding: '5px 12px', fontSize: '12px', fontWeight: 700, color: 'var(--gold)' }}>
            {currentCashier.name}
          </div>
        )}
        {onEndShift && (
          <button onClick={onEndShift}
            title="View shift summary & sign out"
            style={{ position: 'relative', background: 'rgba(224,16,16,.1)', border: '1px solid rgba(224,16,16,.2)', borderRadius: '8px', padding: '5px 11px', fontSize: '12px', color: 'var(--red)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            End Shift
            {shiftOrders.length > 0 && (
              <span style={{ background: 'var(--red)', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: 800 }}>
                {shiftOrders.length}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
