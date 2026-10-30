export type Role = 'Manager' | 'Viewer';

export interface User {
  username: string;
  name: string;
  role: Role;
}

export interface Product {
  sku: string;
  name: string;
  category: string;
  unit: string;
  cost: number;
  price: number;
  stock: number;
  minLevel: number;
  maxLevel: number;
  bin: string;
  supplier: string;
}

export type StockState = 'ok' | 'low' | 'out';

export interface StockMovement {
  id: number;
  ts: string;
  sku: string;
  type: 'Receipt' | 'Pick' | 'Adjust';
  qty: number;
  note: string;
}

export type OrderStatus = 'New' | 'Confirmed' | 'Picking' | 'Shipped' | 'Delivered' | 'Cancelled';

export const ORDER_FLOW: OrderStatus[] = ['New', 'Confirmed', 'Picking', 'Shipped', 'Delivered'];

export interface OrderLine {
  sku: string;
  name: string;
  qty: number;
  price: number;
  onHand: number;
}

export interface Order {
  no: string;
  customer: string;
  placed: string;
  due: string;
  status: OrderStatus;
  total: number;
  lines?: OrderLine[];
}

export interface NewOrder {
  customer: string;
  due: string;
  lines: { sku: string; qty: number }[];
}

export function stockState(p: Product): StockState {
  if (p.stock === 0) {
    return 'out';
  }
  return p.stock < p.minLevel ? 'low' : 'ok';
}

export function nextStatus(status: OrderStatus): OrderStatus | null {
  const i = ORDER_FLOW.indexOf(status);
  return i >= 0 && i < ORDER_FLOW.length - 1 ? ORDER_FLOW[i + 1] : null;
}
