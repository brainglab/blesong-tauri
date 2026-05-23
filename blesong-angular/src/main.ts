import { importProvidersFrom } from '@angular/core';
import { LocationStrategy, PathLocationStrategy } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { QRCodeComponent } from 'angularx-qrcode';

import { AppRoutingModule } from './app/app-routing.module';
import { AppComponent } from './app/app.component';
import { APP_ICONS } from './app/icons';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserModule,
      AppRoutingModule,
      ReactiveFormsModule,
      BrowserAnimationsModule,
      DragDropModule,
      QRCodeComponent,
      FormsModule,
      APP_ICONS,
    ),
    provideHttpClient(withInterceptors([])),
    { provide: LocationStrategy, useClass: PathLocationStrategy },
  ],
}).catch((err) => console.error(err));
