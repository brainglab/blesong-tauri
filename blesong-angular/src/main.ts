import { importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { LocationStrategy, PathLocationStrategy } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { AppRoutingModule } from './app/app-routing.module';
import { AppComponent } from './app/app.component';
import { APP_ICONS } from './app/icons';

bootstrapApplication(AppComponent, {
  providers: [
    // Angular 21 arranca en modo zoneless por defecto si no se provee esto.
    // Sin él, los cambios en callbacks async (HTTP, MQTT, timers) no disparan
    // detección de cambios y las vistas no se actualizan (p. ej. /songs no
    // mostraba las canciones aunque la API respondía 200). Se perdió al migrar
    // a bootstrapApplication; el upgrade a v21 lo había añadido explícitamente.
    provideZoneChangeDetection(),
    // QRCodeComponent is standalone — it's imported directly by h-qr.component,
    // not via importProvidersFrom (which only accepts NgModules).
    importProvidersFrom(
      BrowserModule,
      AppRoutingModule,
      ReactiveFormsModule,
      BrowserAnimationsModule,
      DragDropModule,
      FormsModule,
      APP_ICONS,
    ),
    provideHttpClient(withInterceptors([])),
    { provide: LocationStrategy, useClass: PathLocationStrategy },
  ],
}).catch((err) => console.error(err));
