import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp, setDoc, getDoc, where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Cashier, Category, MenuItem, CartItem, Order, Screen, PaymentMethod, NotificationSettings } from '../lib/types';

const DEFAULT_CATS = ['Alcoholic Drinks', 'Soft Drinks', 'Water & Juice', 'Cocktails & Mixers'];
const DEFAULT_CASHIERS = [
  { name: 'Ama', pin: '1234', photo: '' },
  { name: 'Kofi', pin: '2345', photo: '' },
  { name: 'Abena', pin: '3456', photo: '' },
];
const DEFAULT_MENU = [
  { name: 'Star Beer', category: 'Alcoholic Drinks', price: 15, stock: 24, photo: '' },
  { name: 'Club Beer', category: 'Alcoholic Drinks', price: 15, stock: 24, photo: '' },
  { name: 'Guinness', category: 'Alcoholic Drinks', price: 18, stock: 12, photo: '' },
  { name: 'Heineken', category: 'Alcoholic Drinks', price: 20, stock: 12, photo: '' },
  { name: 'Alomo Bitters', category: 'Alcoholic Drinks', price: 10, stock: 20, photo: '' },
  { name: 'Coca Cola', category: 'Soft Drinks', price: 8, stock: 30, photo: '' },
  { name: 'Fanta', category: 'Soft Drinks', price: 8, stock: 30, photo: '' },
  { name: 'Sprite', category: 'Soft Drinks', price: 8, stock: 30, photo: '' },
  { name: 'Malta', category: 'Soft Drinks', price: 10, stock: 24, photo: '' },
  { name: 'Still Water', category: 'Water & Juice', price: 5, stock: 48, photo: '' },
  { name: 'Verna Water', category: 'Water & Juice', price: 7, stock: 36, photo: '' },
  { name: 'Pineapple Juice', category: 'Water & Juice', price: 12, stock: 20, photo: '' },
  { name: 'Chapman', category: 'Cocktails & Mixers', price: 25, stock: 15, photo: '' },
  { name: 'Mojito', category: 'Cocktails & Mixers', price: 30, stock: 10, photo: '' },
];

const DEFAULT_NOTIF: NotificationSettings = { smsPhone: '', lowStockThreshold: 5, reportTime: '22:00' };

function normalizePhone(raw: string): string | null {
  const t = raw.trim();
  const n = t.startsWith('0') ? '+233' + t.slice(1) : t;
  return /^\+\d{7,15}$/.test(n) ? n : null;
}

function sendSms(phone: string, message: string) {
  const normalized = normalizePhone(phone);
  if (!normalized) { console.warn('[SMS] Invalid phone number:', phone); return; }
  fetch('/api/notify/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: normalized, message }),
  })
    .then(r => r.json())
    .then((j: { ok?: boolean; error?: string }) => {
      if (!j.ok) console.warn('[SMS] Delivery failed:', j.error ?? 'Unknown error');
    })
    .catch(err => console.warn('[SMS] Network error:', err));
}

interface AppContextType {
  screen: Screen;
  setScreen: (s: Screen) => void;
  currentCashier: Cashier | null;
  setCurrentCashier: (c: Cashier | null) => void;
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  adminCreds: { u: string; p: string };
  setAdminCreds: (c: { u: string; p: string }) => void;
  cashiers: Cashier[];
  setCashiers: (c: Cashier[]) => void;
  categories: Category[];
  setCategories: (c: Category[]) => void;
  menuItems: MenuItem[];
  setMenuItems: (m: MenuItem[]) => void;
  cart: CartItem[];
  setCart: (c: CartItem[]) => void;
  selectedPayment: PaymentMethod;
  setSelectedPayment: (p: PaymentMethod) => void;
  loading: boolean;
  shiftOrders: Order[];
  shiftStartTime: Date;
  clearShift: () => void;
  addToCart: (item: MenuItem) => void;
  updateQty: (id: string, delta: number) => void;
  processOrder: () => Promise<Order | null>;
  refreshMenu: () => Promise<void>;
  notifSettings: NotificationSettings;
  setNotifSettings: (s: NotificationSettings) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<Screen>('login');
  const [currentCashier, setCurrentCashier] = useState<Cashier | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCreds, setAdminCreds] = useState({ u: 'admin', p: 'Sjunior03' });
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('Cash');
  const [loading, setLoading] = useState(true);
  const [shiftOrders, setShiftOrders] = useState<Order[]>([]);
  const [shiftStartTime, setShiftStartTime] = useState<Date>(new Date());
  const [notifSettings, setNotifSettingsState] = useState<NotificationSettings>(DEFAULT_NOTIF);

  // Ref so processOrder callback always reads current settings without stale closure
  const notifRef = useRef<NotificationSettings>(DEFAULT_NOTIF);
  useEffect(() => { notifRef.current = notifSettings; }, [notifSettings]);

  const seed = useCallback(async () => {
    const cSnap = await getDocs(collection(db, 'cashiers'));
    if (cSnap.empty) {
      for (const c of DEFAULT_CASHIERS) await addDoc(collection(db, 'cashiers'), c);
    }
    const catSnap = await getDocs(collection(db, 'categories'));
    if (catSnap.empty) {
      for (const name of DEFAULT_CATS) await addDoc(collection(db, 'categories'), { name });
    }
    const mSnap = await getDocs(collection(db, 'menu'));
    if (mSnap.empty) {
      for (const item of DEFAULT_MENU) await addDoc(collection(db, 'menu'), item);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await seed();
      const [cSnap, catSnap, mSnap, notifSnap] = await Promise.all([
        getDocs(query(collection(db, 'cashiers'), orderBy('name'))),
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'menu')),
        getDoc(doc(db, 'settings', 'notifications')),
      ]);
      setCashiers(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Cashier)));
      setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
      setMenuItems(mSnap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)));
      if (notifSnap.exists()) {
        const raw = notifSnap.data();
        const data: NotificationSettings = {
          smsPhone: raw.smsPhone ?? '',
          lowStockThreshold: raw.lowStockThreshold ?? 5,
          reportTime: raw.reportTime ?? '22:00',
        };
        setNotifSettingsState(data);
        notifRef.current = data;
      }
    } catch (e) {
      console.error('Failed to load data', e);
    } finally {
      setLoading(false);
    }
  }, [seed]);

  const refreshMenu = useCallback(async () => {
    const mSnap = await getDocs(collection(db, 'menu'));
    setMenuItems(mSnap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const clearShift = useCallback(() => {
    setShiftOrders([]);
    setShiftStartTime(new Date());
  }, []);

  const setNotifSettings = useCallback(async (s: NotificationSettings) => {
    setNotifSettingsState(s);
    notifRef.current = s;
    await setDoc(doc(db, 'settings', 'notifications'), s);
  }, []);

  // ── Scheduled daily report ──────────────────────────────────────────────────
  useEffect(() => {
    const tick = async () => {
      const cfg = notifRef.current;
      if (!cfg.smsPhone?.trim() || !cfg.reportTime) return;
      const now = new Date();
      const hhmm = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      if (hhmm !== cfg.reportTime) return;
      const today = now.toISOString().split('T')[0];
      const lastSent = localStorage.getItem('lastDailyReportDate');
      if (lastSent === today) return;
      // Mark as sent immediately to avoid duplicate sends within the same minute
      localStorage.setItem('lastDailyReportDate', today);
      try {
        const snap = await getDocs(query(collection(db, 'orders'), where('date', '==', today)));
        const orders = snap.docs.map(d => d.data() as Order);
        const total = orders.reduce((s, o) => s + (o.total || 0), 0);
        const byPay = { Cash: 0, MoMo: 0, Card: 0 };
        orders.forEach(o => { if (byPay[o.paymentMethod as keyof typeof byPay] !== undefined) byPay[o.paymentMethod as keyof typeof byPay] += o.total || 0; });
        const byItem: Record<string, number> = {};
        orders.forEach(o => (o.items || []).forEach(i => { byItem[i.name] = (byItem[i.name] || 0) + i.qty; }));
        const top3 = Object.entries(byItem).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n, q]) => `${n}(${q})`).join(', ');
        const msg = `📊 KUNIM BAR DAILY REPORT (${today})\nRevenue: GH₵${total.toFixed(2)} | Orders: ${orders.length}\nCash: GH₵${byPay.Cash.toFixed(2)} | MoMo: GH₵${byPay.MoMo.toFixed(2)} | Card: GH₵${byPay.Card.toFixed(2)}\nTop items: ${top3 || 'N/A'}`;
        sendSms(cfg.smsPhone, msg);
      } catch (e) {
        console.warn('[SMS] Daily report query failed:', e);
        localStorage.removeItem('lastDailyReportDate');
      }
    };

    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const addToCart = useCallback((item: MenuItem) => {
    if (item.stock <= 0) return;
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      if (ex) {
        if (ex.qty >= item.stock) return prev;
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1, photo: item.photo || '' }];
    });
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0));
  }, []);

  const processOrder = useCallback(async (): Promise<Order | null> => {
    if (!cart.length || !currentCashier) return null;
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const order: Omit<Order, 'id'> = {
      items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, photo: i.photo })),
      total,
      paymentMethod: selectedPayment,
      cashier: currentCashier.name,
      cashierId: currentCashier.id,
      customer: '',
      table: '',
      timestamp: serverTimestamp(),
      date: new Date().toISOString().split('T')[0],
    };
    const ref = await addDoc(collection(db, 'orders'), order);

    // Detect stock changes and fire alerts
    const newlyOutOfStock: string[] = [];
    const newlyLowStock: Array<{ name: string; stock: number }> = [];
    const threshold = notifRef.current.lowStockThreshold ?? 5;

    for (const cartItem of cart) {
      const menuItem = menuItems.find(m => m.id === cartItem.id);
      if (menuItem) {
        const prevStock = menuItem.stock;
        const newStock = prevStock - cartItem.qty;
        if (newStock <= 0) {
          newlyOutOfStock.push(menuItem.name);
        } else if (newStock <= threshold && prevStock > threshold) {
          newlyLowStock.push({ name: menuItem.name, stock: newStock });
        }
        await updateDoc(doc(db, 'menu', cartItem.id), { stock: newStock });
        setMenuItems(prev => prev.map(m => m.id === cartItem.id ? { ...m, stock: newStock } : m));
      }
    }

    const { smsPhone } = notifRef.current;
    if (smsPhone?.trim()) {
      if (newlyOutOfStock.length > 0) {
        const names = newlyOutOfStock.join(', ');
        sendSms(smsPhone, `⚠️ KUNIM BAR OUT OF STOCK: ${names} just ran out. Please restock urgently.`);
      }
      if (newlyLowStock.length > 0) {
        const items = newlyLowStock.map(i => `${i.name} (${i.stock} left)`).join(', ');
        sendSms(smsPhone, `📉 KUNIM BAR LOW STOCK: ${items}. Consider restocking soon.`);
      }
    }

    const savedOrder: Order = { ...order, id: ref.id };
    setShiftOrders(prev => [...prev, savedOrder]);
    setCart([]);
    return savedOrder;
  }, [cart, currentCashier, selectedPayment, menuItems]);

  // Reset shift timer when a cashier logs in
  const handleSetCurrentCashier = useCallback((c: Cashier | null) => {
    setCurrentCashier(c);
    if (c) {
      setShiftOrders([]);
      setShiftStartTime(new Date());
    }
  }, []);

  return (
    <AppContext.Provider value={{
      screen, setScreen,
      currentCashier, setCurrentCashier: handleSetCurrentCashier,
      isAdmin, setIsAdmin,
      adminCreds, setAdminCreds,
      cashiers, setCashiers,
      categories, setCategories,
      menuItems, setMenuItems,
      cart, setCart,
      selectedPayment, setSelectedPayment,
      loading,
      shiftOrders,
      shiftStartTime,
      clearShift,
      addToCart, updateQty, processOrder,
      refreshMenu,
      notifSettings, setNotifSettings,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
