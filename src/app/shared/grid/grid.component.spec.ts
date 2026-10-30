import { GridColumn, toColDefs } from './grid.component';

describe('toColDefs', () => {
  const columns: GridColumn[] = [
    { key: 'name', header: 'Name' },
    { key: 'price', header: 'Price', type: 'currency' },
    { key: 'qty', header: 'Qty', type: 'number' },
    { key: 'status', header: 'Status', type: 'pill', pill: r => ({ text: r.status, cls: 'ok' }), sortValue: r => r.rank }
  ];

  it('maps headers and fields and makes every column sortable', () => {
    const defs = toColDefs(columns);
    expect(defs.map(d => d.headerName)).toEqual(['Name', 'Price', 'Qty', 'Status']);
    expect(defs.map(d => d.field)).toEqual(['name', 'price', 'qty', 'status']);
    expect(defs.every(d => d.sortable === true)).toBe(true);
  });

  it('formats currency and number columns and right-aligns them', () => {
    const defs = toColDefs(columns);
    expect(defs[1].type).toBe('numericColumn');
    expect((defs[1].valueFormatter as any)({ value: 1234.5 })).toBe('$1,234.50');
    expect((defs[2].valueFormatter as any)({ value: 5200 })).toBe('5,200');
  });

  it('renders a pill element from the column callback', () => {
    const el = (toColDefs(columns)[3].cellRenderer as any)({ data: { status: 'Low' } }) as HTMLElement;
    expect(el.className).toBe('pill ok');
    expect(el.textContent).toBe('Low');
  });

  it('sorts by sortValue instead of the displayed field', () => {
    const cmp = toColDefs(columns)[3].comparator as any;
    expect(cmp('x', 'y', { data: { rank: 2 } }, { data: { rank: 1 } })).toBe(1);
    expect(cmp('x', 'y', { data: { rank: 1 } }, { data: { rank: 1 } })).toBe(0);
  });
});
