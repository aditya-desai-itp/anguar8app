import { Product, nextStatus, stockState } from './models';

describe('models', () => {
  const product = { stock: 10, minLevel: 5 } as Product;

  it('classifies stock levels', () => {
    expect(stockState({ ...product, stock: 0 })).toBe('out');
    expect(stockState({ ...product, stock: 4 })).toBe('low');
    expect(stockState({ ...product, stock: 5 })).toBe('ok');
  });

  it('walks the order flow and stops at Delivered', () => {
    expect(nextStatus('New')).toBe('Confirmed');
    expect(nextStatus('Shipped')).toBe('Delivered');
    expect(nextStatus('Delivered')).toBeNull();
    expect(nextStatus('Cancelled')).toBeNull();
  });
});
