import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

declare const initSqlJs: any;

const STORAGE_KEY = 'forge-inventory-db-v1';

/**
 * Thin wrapper around an in-browser SQLite database (sql.js).
 * The database file is saved to localStorage after every write so data survives a reload.
 * Feature services use this class only; nothing else knows SQLite is underneath.
 */
@Injectable({ providedIn: 'root' })
export class DbService {
  private db: any;
  private inTransaction = false;

  constructor(private http: HttpClient) {}

  init(): Promise<void> {
    return initSqlJs({ locateFile: (file: string) => 'assets/' + file }).then((SQL: any) => {
      const saved = this.load();
      if (saved) {
        this.db = new SQL.Database(saved);
        return undefined;
      }
      this.db = new SQL.Database();
      return this.http
        .get('assets/seed.sql', { responseType: 'text' })
        .toPromise()
        .then(sql => {
          this.db.exec(sql);
          this.persist();
        });
    });
  }

  query<T>(sql: string, params: any[] = []): T[] {
    const stmt = this.db.prepare(sql);
    const rows: T[] = [];
    try {
      stmt.bind(params);
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as T);
      }
    } finally {
      stmt.free();
    }
    return rows;
  }

  queryOne<T>(sql: string, params: any[] = []): T | null {
    const rows = this.query<T>(sql, params);
    return rows.length ? rows[0] : null;
  }

  run(sql: string, params: any[] = []): void {
    this.db.run(sql, params);
    if (!this.inTransaction) {
      this.persist();
    }
  }

  transaction<T>(work: () => T): T {
    this.db.run('BEGIN');
    this.inTransaction = true;
    try {
      const result = work();
      this.db.run('COMMIT');
      this.inTransaction = false;
      this.persist();
      return result;
    } catch (e) {
      this.db.run('ROLLBACK');
      this.inTransaction = false;
      throw e;
    }
  }

  /** Drops the saved database so the next load starts from the seed data again. */
  reset(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // storage unavailable; nothing to clear
    }
  }

  private persist(): void {
    try {
      const bytes: Uint8Array = this.db.export();
      let binary = '';
      bytes.forEach(byte => (binary += String.fromCharCode(byte)));
      localStorage.setItem(STORAGE_KEY, btoa(binary));
    } catch (e) {
      console.warn('Could not save the database to localStorage', e);
    }
  }

  private load(): Uint8Array | null {
    try {
      const text = localStorage.getItem(STORAGE_KEY);
      if (!text) {
        return null;
      }
      const binary = atob(text);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } catch (e) {
      return null;
    }
  }
}
