import { AppProvider, useApp } from './contexts/AppContext';
import LoginScreen from './screens/LoginScreen';
import POSScreen from './screens/POSScreen';
import OrdersScreen from './screens/OrdersScreen';
import ReportsScreen from './screens/ReportsScreen';
import AdminScreen from './screens/AdminScreen';

function AppInner() {
  const { screen } = useApp();

  return (
    <>
      <div id="thermalPrint" />
      {screen === 'login' && <LoginScreen />}
      {screen === 'pos' && <POSScreen />}
      {screen === 'orders' && <OrdersScreen />}
      {screen === 'reports' && <ReportsScreen />}
      {screen === 'admin' && <AdminScreen />}
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
