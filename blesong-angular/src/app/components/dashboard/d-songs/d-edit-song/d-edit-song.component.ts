import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { PageHeaderComponent } from '../../../../layout/page-header/page-header.component';
import { BackButtonDirective } from '../../../../directives/back-button.directive';
import { LucideAngularModule } from 'lucide-angular';

import { SongModel } from 'src/app/models/song.model';
import { SongService } from 'src/app/services/song.service';
import { SToastService } from 'src/app/components/shared/s-toast/s-toast.service';
import { SModalLoadingService } from 'src/app/components/shared/s-modal-loading/s-modal-loading.service';
import { DFormSongComponent } from '../d-form-song/d-form-song.component';


@Component({
    selector: 'app-d-edit-song',
    templateUrl: './d-edit-song.component.html',
    imports: [PageHeaderComponent, BackButtonDirective, DFormSongComponent, LucideAngularModule],
})
export class DEditSongComponent implements OnInit {
  mSong: SongModel = new SongModel();

  mIdx = ""

  disabled = false;

  constructor(private mRouter: Router, private mActivatedRoute: ActivatedRoute, private mSongService: SongService,
    private mSToastService: SToastService, private mSModalLoadingService: SModalLoadingService) {

    let mEventClose = this.mSModalLoadingService.show();
    this.mActivatedRoute.params.subscribe(params => {

      this.mIdx = params['idx'];

      this.mSongService.get(this.mIdx).subscribe({
        error: (err: any) => {

          switch (err.error['code']) {
            case '20':
              this.mSToastService.danger(`Ya existe un registro parecido a este... No se pueden repetir los campos clave`);
              break;
            default:
              this.mSToastService.danger(`Error inesperado, intenta mas tarde (Code: 01)`);
              break;
          }
        },
        next: (result: any) => {
          this.mSong = result.song;
        }

      }).add(() => {
        mEventClose.next();
      });

    });
  }

  ngOnInit(): void {
  }

  save(mSong: SongModel) {
    this.mSong = mSong;

    let mEventClose = this.mSModalLoadingService.show();
    this.mSongService.update(this.mSong, this.mIdx).subscribe({
      error: (err: any) => {

        switch (err.error['code']) {
          case '20':
            this.mSToastService.danger(`Ya existe un registro parecido a este... No se pueden repetir los campos clave`);
            break;
          default:
            this.mSToastService.danger(`Error inesperado, intenta mas tarde (Code: 01)`);
            break;
        }
      },
      next: (result: any) => {
        this.mRouter.navigate(['/songs']);
      }

    }).add(() => {
      mEventClose.next();
    });
  }
}
