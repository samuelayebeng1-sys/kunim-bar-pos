export interface Cashier {
  id: string;
  name: string;
  pin: string;
  photo: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  photo: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  photo: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  photo: string;
}

export interface Order {
  id?: string;
  items: OrderItem[];
  total: number;
  paymentMethod: 'Cash' | 'MoMo' | 'Card';
  cashier: string;
  cashierId: string;
  customer: string;
  table: string;
  timestamp: any;
  date: string;
}

export type PaymentMethod = 'Cash' | 'MoMo' | 'Card';
export type Screen = 'login' | 'pos' | 'orders' | 'reports' | 'admin';

export interface NotificationSettings {
  smsPhone: string;
}
