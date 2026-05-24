import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { environment } from 'src/environments/environment';

import { AppShellComponent } from './layout/app-shell/app-shell.component';

import { DEditAutorComponent } from './components/dashboard/d-autors/d-edit-autor/d-edit-autor.component';
import { DListAutorComponent } from './components/dashboard/d-autors/d-list-autor/d-list-autor.component';
import { DNewAutorComponent } from './components/dashboard/d-autors/d-new-autor/d-new-autor.component';
import { DShowAutorComponent } from './components/dashboard/d-autors/d-show-autor/d-show-autor.component';

import { DEditSongComponent } from './components/dashboard/d-songs/d-edit-song/d-edit-song.component';
import { DListSongComponent } from './components/dashboard/d-songs/d-list-song/d-list-song.component';
import { DNewSongComponent } from './components/dashboard/d-songs/d-new-song/d-new-song.component';
import { DShowSongComponent } from './components/dashboard/d-songs/d-show-song/d-show-song.component';

import { HPresenterObsLettersComponent } from './components/home/h-presenter-obs/h-presenter-obs-letters/h-presenter-obs-letters.component';
import { HPresenterObsBibleComponent } from './components/home/h-presenter-obs/h-presenter-obs-bible/h-presenter-obs-bible.component';

import { HPresenterComponent } from './components/home/h-presenter/h-presenter.component';
import { HPresenterLetterComponent } from './components/home/h-presenter-letter/h-presenter-letter.component';
import { HQrMenuComponent } from './components/home/h-qr-menu/h-qr-menu.component';
import { HQrDashboardComponent } from './components/home/h-qr-dashboard/h-qr-dashboard.component';
import { HQrMenuPageComponent } from './components/home/h-qr-menu-page/h-qr-menu-page.component';

const appTitle = environment.app.name;

const ROUTES: Routes = [

  // Standalone (no shell) — these are embedded in OBS browser sources or shown
  // on external devices via QR. They must not carry the desktop chrome.
  { path: 'presenter/slide', title: `${appTitle} | OBS Player`, component: HPresenterComponent },
  { path: 'presenter/letter', title: `${appTitle} | Letra`, component: HPresenterLetterComponent },
  { path: 'presenter/qr-menu', title: `${appTitle} | QR Menu`, component: HQrMenuComponent },
  { path: 'presenter/qr-menu-page', title: `${appTitle} | QR Menu Page`, component: HQrMenuPageComponent },

  // Dashboard / OBS control routes — wrapped in the app shell (sidebar + status)
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: 'songs', title: `${appTitle} | Canciones`, component: DListSongComponent },
      { path: 'songs/new', title: `${appTitle} | Crear canción`, component: DNewSongComponent },
      { path: 'songs/edit/:idx', title: `${appTitle} | Editar canción`, component: DEditSongComponent },
      { path: 'songs/show/:idx', title: `${appTitle} | Canción`, component: DShowSongComponent },

      { path: 'autors', title: `${appTitle} | Autores`, component: DListAutorComponent },
      { path: 'autors/new', title: `${appTitle} | Crear autor`, component: DNewAutorComponent },
      { path: 'autors/edit/:idx', title: `${appTitle} | Editar autor`, component: DEditAutorComponent },
      { path: 'autors/show/:idx', title: `${appTitle} | Autor`, component: DShowAutorComponent },

      { path: 'presenter/obs-letters', title: `${appTitle} | OBS Letras`, component: HPresenterObsLettersComponent },
      { path: 'presenter/obs-bible', title: `${appTitle} | OBS Biblia`, component: HPresenterObsBibleComponent },
      { path: 'presenter/qr-dashboard', title: `${appTitle} | Código QR`, component: HQrDashboardComponent },

      { path: '', pathMatch: 'full', redirectTo: 'songs' },
    ],
  },

  { path: '**', redirectTo: 'songs' },
];

@NgModule({
  imports: [RouterModule.forRoot(ROUTES, { useHash: false, scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule],
})
export class AppRoutingModule { }
