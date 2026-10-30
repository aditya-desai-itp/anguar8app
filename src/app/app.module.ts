import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DbService } from './core/db.service';
import { GlobalErrorHandler } from './core/global-error-handler';
import { LoginComponent } from './features/auth/login.component';
import { ShellComponent } from './features/shell/shell.component';
import { SharedModule } from './shared/shared.module';

/** Opens the SQLite database before the first route renders. */
export function initDatabase(db: DbService): () => Promise<void> {
  return () => db.init();
}

@NgModule({
  declarations: [AppComponent, LoginComponent, ShellComponent],
  imports: [BrowserModule, HttpClientModule, SharedModule, AppRoutingModule],
  providers: [
    { provide: APP_INITIALIZER, useFactory: initDatabase, deps: [DbService], multi: true },
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
