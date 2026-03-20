import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { environment } from 'src/environments/environment.prod';

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

const ROUTES: Routes = [

  // ----------------------------------------------------------------------------------------------------------------------------------
  // public home
  // ----------------------------------------------------------------------------------------------------------------------------------

  { path: 'autors/edit/:idx', title: `${environment.app.name} | Editar autor`, component: DEditAutorComponent, canActivate: [] },
  { path: 'autors', title: `${environment.app.name} | autores`, component: DListAutorComponent, canActivate: [] },
  { path: 'autors/new', title: `${environment.app.name} | Crear autor`, component: DNewAutorComponent, canActivate: [] },
  { path: 'autors/show/:idx', title: `${environment.app.name} | autor`, component: DShowAutorComponent, canActivate: [] },

  { path: 'songs/edit/:idx', title: `${environment.app.name} | Editar cancion`, component: DEditSongComponent, canActivate: [] },
  { path: 'songs', title: `${environment.app.name} | canciones`, component: DListSongComponent, canActivate: [] },
  { path: 'songs/new', title: `${environment.app.name} | Crear cancion`, component: DNewSongComponent, canActivate: [] },
  { path: 'songs/show/:idx', title: `${environment.app.name} | cancion`, component: DShowSongComponent, canActivate: [] },

  { path: 'presenter/obs-letters', title: `${environment.app.name} | OBS Menú`, component: HPresenterObsLettersComponent, canActivate: [] },
  { path: 'presenter/obs-bible', title: `${environment.app.name} | OBS Biblia`, component: HPresenterObsBibleComponent, canActivate: [] },

  { path: 'presenter/slide', title: `${environment.app.name} | OBS Player`, component: HPresenterComponent, canActivate: [] },
  { path: 'presenter/letter', title: `${environment.app.name} | Letra`, component: HPresenterLetterComponent, canActivate: [] },
  { path: 'presenter/qr-dashboard', title: `${environment.app.name} | QR`, component: HQrDashboardComponent, canActivate: [] },
  { path: 'presenter/qr-menu', title: `${environment.app.name} | QR Menu`, component: HQrMenuComponent, canActivate: [] },
  { path: 'presenter/qr-menu-page', title: `${environment.app.name} | QR Menu Page`, component: HQrMenuPageComponent, canActivate: [] },

  // ----------------------------------------------------------------------------------------------------------------------------------
  // default
  // ----------------------------------------------------------------------------------------------------------------------------------
  { path: '', pathMatch: 'full', redirectTo: 'songs' },
  { path: '*', pathMatch: 'full', redirectTo: 'songs' },
  { path: '**', pathMatch: 'full', redirectTo: 'songs' }
];

@NgModule({
  imports: [RouterModule.forRoot(ROUTES, { useHash: false, scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule],
})
export class AppRoutingModule { }
