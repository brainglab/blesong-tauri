import { provideZoneChangeDetection, importProvidersFrom } from "@angular/core";
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';


import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { LocationStrategy, PathLocationStrategy } from "@angular/common";
import { BrowserModule, bootstrapApplication } from "@angular/platform-browser";
import { AppRoutingModule } from "./app/app-routing.module";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { QRCodeComponent } from "angularx-qrcode";
import { AppComponent } from "./app/app.component";


bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule, AppRoutingModule, ReactiveFormsModule, BrowserAnimationsModule, DragDropModule, QRCodeComponent, FormsModule),
        provideHttpClient(withInterceptors([])),
        {
            provide: LocationStrategy,
            useClass: PathLocationStrategy
        }
    ]
})
  .catch(err => console.error(err));
