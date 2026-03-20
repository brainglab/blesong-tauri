import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { SModalLoadingComponent } from './components/shared/s-modal-loading/s-modal-loading.component';
import { SModalYesNoComponent } from './components/shared/s-modal-yes-no/s-modal-yes-no.component';
import { SToastContainerComponent } from './components/shared/s-toast/s-toast-container.component';
import { SToastComponent } from './components/shared/s-toast/s-toast.component';
import { SModalOptionComponent } from './components/shared/s-modal-option/s-modal-option.component';
import { UploadFileComponent } from './components/shared/upload-file/upload-file.component';
import { QRCodeModule } from 'angularx-qrcode';

import { BackButtonDirective } from './directives/back-button.directive';

import { CapitalizePipe } from './pipes/capitalize.pipe';
import { ThousandSeparatorPipe } from './pipes/thousand-separator.pipe';
import { EncapsulationHtmlPipe } from './pipes/encapsulation-html.pipe';
import { FormatPipe } from './pipes/format.pipe';
import { TimeAgoPipe } from './pipes/time-ago.pipe';
import { TruncatePipe } from './pipes/truncate.pipe';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MarkdownModule } from 'ngx-markdown';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgxTypedJsModule } from 'ngx-typed-js';
import { LocationStrategy, PathLocationStrategy } from '@angular/common';

import { HSidebarComponent } from './components/home/h-sidebar/h-sidebar.component';
import { HNavbarComponent } from './components/home/h-navbar/h-navbar.component';

import { DEditAutorComponent } from './components/dashboard/d-autors/d-edit-autor/d-edit-autor.component';
import { DFormAutorComponent } from './components/dashboard/d-autors/d-form-autor/d-form-autor.component';
import { DListAutorComponent } from './components/dashboard/d-autors/d-list-autor/d-list-autor.component';
import { DLoadAutorComponent } from './components/dashboard/d-autors/d-load-autor/d-load-autor.component';
import { DNewAutorComponent } from './components/dashboard/d-autors/d-new-autor/d-new-autor.component';
import { DShowAutorComponent } from './components/dashboard/d-autors/d-show-autor/d-show-autor.component';
import { DSearchAutorComponent } from './components/dashboard/d-autors/d-search-autor/d-search-autor.component';

import { DEditSongComponent } from './components/dashboard/d-songs/d-edit-song/d-edit-song.component';
import { DFormSongComponent } from './components/dashboard/d-songs/d-form-song/d-form-song.component';
import { DListSongComponent } from './components/dashboard/d-songs/d-list-song/d-list-song.component';
import { DLoadSongComponent } from './components/dashboard/d-songs/d-load-song/d-load-song.component';
import { DNewSongComponent } from './components/dashboard/d-songs/d-new-song/d-new-song.component';
import { DShowSongComponent } from './components/dashboard/d-songs/d-show-song/d-show-song.component';
import { DSearchSongComponent } from './components/dashboard/d-songs/d-search-song/d-search-song.component';
import { HPresenterComponent } from './components/home/h-presenter/h-presenter.component';
import { HPresenterObsLettersComponent } from './components/home/h-presenter-obs/h-presenter-obs-letters/h-presenter-obs-letters.component';
import { HQrComponent } from './components/home/h-qr/h-qr.component';
import { HPresenterLetterComponent } from './components/home/h-presenter-letter/h-presenter-letter.component';
import { HQrMenuComponent } from './components/home/h-qr-menu/h-qr-menu.component';
import { HQrDashboardComponent } from './components/home/h-qr-dashboard/h-qr-dashboard.component';
import { HQrMenuPageComponent } from './components/home/h-qr-menu-page/h-qr-menu-page.component';
import { HPresenterObsNavbarComponent } from './components/home/h-presenter-obs/h-presenter-obs-navbar/h-presenter-obs-navbar.component';
import { HPresenterObsBibleComponent } from './components/home/h-presenter-obs/h-presenter-obs-bible/h-presenter-obs-bible.component';

@NgModule({
  declarations: [
    AppComponent,

    SModalLoadingComponent,
    SModalYesNoComponent,
    SToastContainerComponent,
    SToastComponent,
    SModalOptionComponent,
    UploadFileComponent,

    BackButtonDirective,

    CapitalizePipe,
    EncapsulationHtmlPipe,
    ThousandSeparatorPipe,
    FormatPipe,
    TimeAgoPipe,
    TruncatePipe,

    HSidebarComponent,
    HNavbarComponent,

    DEditAutorComponent,
    DFormAutorComponent,
    DListAutorComponent,
    DLoadAutorComponent,
    DNewAutorComponent,
    DShowAutorComponent,
    DSearchAutorComponent,

    DEditSongComponent,
    DFormSongComponent,
    DListSongComponent,
    DLoadSongComponent,
    DNewSongComponent,
    DShowSongComponent,
    DSearchSongComponent,
    HPresenterComponent,
    HPresenterObsLettersComponent,
    HQrComponent,
    HPresenterLetterComponent,
    HQrMenuComponent,
    HQrDashboardComponent,
    HQrMenuPageComponent,
    HPresenterObsNavbarComponent,
    HPresenterObsBibleComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    NgxTypedJsModule,
    MarkdownModule.forRoot(),
    DragDropModule,
    QRCodeModule,
    FormsModule,
  ],
  providers: [
    provideHttpClient(withInterceptors([])),
    {
      provide: LocationStrategy,
      useClass: PathLocationStrategy
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
