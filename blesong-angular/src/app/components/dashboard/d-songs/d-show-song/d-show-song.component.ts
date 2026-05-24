import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from "@angular/router";
import { SongService } from 'src/app/services/song.service';
import { SToastService } from '../../../shared/s-toast/s-toast.service';
import { SModalLoadingService } from '../../../shared/s-modal-loading/s-modal-loading.service';
import { BackButtonDirective } from '../../../../directives/back-button.directive';
import { DatePipe } from '@angular/common';
import { EncapsulationHtmlPipe } from '../../../../pipes/encapsulation-html.pipe';
import { LucideAngularModule } from 'lucide-angular';
import { PageHeaderComponent } from '../../../../layout/page-header/page-header.component';

@Component({
    selector: 'app-d-show-song',
    templateUrl: './d-show-song.component.html',
    imports: [PageHeaderComponent, RouterLink, BackButtonDirective, DatePipe, EncapsulationHtmlPipe, LucideAngularModule],
})
export class DShowSongComponent implements OnInit {

  mSong: any = {};
  mAutor: any = {};

  mIdx = ""

  constructor(private mRouter: Router, private mActivatedRoute: ActivatedRoute, private mSongService: SongService,
    private mSToastService: SToastService, private mSModalLoadingService: SModalLoadingService) {

    let mEventClose = this.mSModalLoadingService.show();
    this.mActivatedRoute.params.subscribe(params => {

      this.mIdx = params['idx'];

      this.mSongService.get(this.mIdx).subscribe({
        error: (err: any) => {

          switch (err.error['code']) {
            default:
              this.mSToastService.danger(`Error inesperado, intenta mas tarde (Code: 01)`);
              break;
          }
        },
        next: (result: any) => {
          this.mSong = result.song;
          this.mAutor = result.song.autor;
        },
      }).add(() => {
        mEventClose.next();
      });

    });
  }

  ngOnInit(): void {
  }

}
