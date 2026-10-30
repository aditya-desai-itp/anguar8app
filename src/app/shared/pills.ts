import { Order, OrderStatus, Product, stockState } from '../models/models';

const ORDER_CLASS: { [status in OrderStatus]: string } = {
  New: 'info',
  Confirmed: 'info',
  Picking: 'warn',
  Shipped: 'warn',
  Delivered: 'ok',
  Cancelled: 'bad'
};

export function stockPill(p: Product): { text: string; cls: string } {
  switch (stockState(p)) {
    case 'ok':
      return { text: 'In stock', cls: 'ok' };
    case 'low':
      return { text: 'Low', cls: 'warn' };
    default:
      return { text: 'Out', cls: 'bad' };
  }
}

export function stockBar(p: Product): { pct: number; cls: string } {
  const state = stockState(p);
  return {
    pct: Math.min(100, Math.round((p.stock / p.maxLevel) * 100)),
    cls: state === 'ok' ? '' : state === 'low' ? 'mid' : 'low'
  };
}

export function orderPill(o: Order): { text: string; cls: string } {
  return { text: o.status, cls: ORDER_CLASS[o.status] };
}
