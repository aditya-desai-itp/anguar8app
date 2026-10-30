import { ChangeDetectionStrategy, Component, EventEmitter, Input, NgZone, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CellKeyDownEvent, ColDef, GridReadyEvent, GridSizeChangedEvent, RowClickedEvent } from 'ag-grid-community';

export interface GridColumn {
  key: string;
  header: string;
  type?: 'text' | 'number' | 'currency' | 'pill' | 'bar';
  mono?: boolean;
  /** Required for 'pill' columns. */
  pill?: (row: any) => { text: string; cls: string };
  /** Required for 'bar' columns. */
  bar?: (row: any) => { pct: number; cls: string };
  /** Overrides row[key] when sorting. */
  sortValue?: (row: any) => string | number;
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const compare = (a: any, b: any) => (a > b ? 1 : a < b ? -1 : 0);

/** Translates the app's simple column description into ag-Grid column definitions. */
export function toColDefs(columns: GridColumn[]): ColDef[] {
  return columns.map(c => {
    const def: ColDef = {
      headerName: c.header,
      field: c.key,
      sortable: true,
      minWidth: c.type && c.type !== 'text' ? 90 : 150,
      cellClass: c.mono ? ['mono'] : []
    };
    if (c.type === 'number' || c.type === 'currency') {
      def.type = 'numericColumn';
      // cellClass above would replace the type's own class, so the alignment class is set here as well
      def.cellClass = ['mono', 'ag-right-aligned-cell'];
      def.valueFormatter = p => (c.type === 'currency' ? currency.format(p.value) : Number(p.value).toLocaleString('en-US'));
    }
    if (c.type === 'pill' && c.pill) {
      const pill = c.pill;
      def.cellRenderer = p => {
        const view = pill(p.data);
        const el = document.createElement('span');
        el.className = 'pill ' + view.cls;
        el.textContent = view.text;
        return el;
      };
    }
    if (c.type === 'bar' && c.bar) {
      const bar = c.bar;
      def.cellRenderer = p => {
        const view = bar(p.data);
        const track = document.createElement('span');
        track.className = ('bar ' + view.cls).trim();
        const fill = document.createElement('i');
        fill.style.width = view.pct + '%';
        track.appendChild(fill);
        const label = document.createElement('span');
        label.className = 'mono';
        label.textContent = view.pct + '%';
        const el = document.createElement('span');
        el.appendChild(track);
        el.appendChild(label);
        return el;
      };
    }
    if (c.sortValue) {
      const value = c.sortValue;
      def.comparator = (a, b, nodeA, nodeB) => compare(value(nodeA.data), value(nodeB.data));
    }
    return def;
  });
}

/**
 * Presentational data grid built on ag-Grid: client-side sort and paging, row click output.
 * The parent owns the data and any filtering.
 */
@Component({
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridComponent implements OnChanges {
  @Input() columns: GridColumn[] = [];
  @Input() rows: any[] = [];
  @Input() pageSize = 8;
  @Input() emptyText = 'No records match.';
  @Output() rowClick = new EventEmitter<any>();

  colDefs: ColDef[] = [];
  noRowsTemplate = '';

  constructor(private zone: NgZone) {}

  ngOnChanges(changes: SimpleChanges): void {
    // New column definitions make ag-Grid forget column widths, so only rebuild them when they really changed.
    if (changes.columns) {
      this.colDefs = toColDefs(this.columns);
    }
    this.noRowsTemplate = '<span class="text-muted">' + this.emptyText.replace(/</g, '&lt;') + '</span>';
  }

  /** This ag-Grid version has no flex columns, so columns are stretched to the grid width instead. */
  fit(event: GridReadyEvent | GridSizeChangedEvent): void {
    event.api.sizeColumnsToFit();
  }

  // ag-Grid raises its events outside Angular's zone. Re-entering the zone here means the modals opened by
  // the parent, and everything that happens inside them, are change-detected normally.
  onRowClicked(event: RowClickedEvent): void {
    this.zone.run(() => this.rowClick.emit(event.data));
  }

  onCellKeyDown(event: CellKeyDownEvent): void {
    const key = event.event as KeyboardEvent | undefined;
    if (key && key.key === 'Enter') {
      this.zone.run(() => this.rowClick.emit(event.data));
    }
  }
}
