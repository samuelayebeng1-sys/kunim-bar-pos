import { useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import LoginScreen from './screens/LoginScreen';
import POSScreen from './screens/POSScreen';
import OrdersScreen from './screens/OrdersScreen';
import ReportsScreen from './screens/ReportsScreen';
import AdminScreen from './screens/AdminScreen';
import ShiftSummaryModal from './components/modals/ShiftSummaryModal';

function AppInner() {
  const { screen, currentCashier, shiftOrders, shiftStartTime, setCurrentCashier, setCart, setIsAdmin, setScreen } = useApp();
  const [showShift, setShowShift] = useState(false);

  function handleEndShift() {
    setCurrentCashier(null);
    setCart([]);
    setIsAdmin(false);
    setShowShift(false);
    setScreen('login');
  }

  return (
    <>
      {screen === 'login' && <LoginScreen />}
      {screen === 'pos' && <POSScreen onEndShift={() => setShowShift(true)} />}
      {screen === 'orders' && <OrdersScreen onEndShift={() => setShowShift(true)} />}
      {screen === 'reports' && <ReportsScreen onEndShift={() => setShowShift(true)} />}
      {screen === 'admin' && <AdminScreen />}

      {showShift && currentCashier && (
        <ShiftSummaryModal
          cashierName={currentCashier.name}
          shiftStart={shiftStartTime}
          orders={shiftOrders}
          onClose={() => setShowShift(false)}
          onEndShift={handleEndShift}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
