import { Component, OnInit, Renderer2 } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from "@angular/router";
import { AutorService } from 'src/app/services/autor.service';
import { SToastService } from '../../../shared/s-toast/s-toast.service';
import { SModalLoadingService } from '../../../shared/s-modal-loading/s-modal-loading.service';
import { HSidebarComponent } from '../../../home/h-sidebar/h-sidebar.component';
import { HNavbarComponent } from '../../../home/h-navbar/h-navbar.component';
import { BackButtonDirective } from '../../../../directives/back-button.directive';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-d-show-autor',
    templateUrl: './d-show-autor.component.html',
    imports: [HSidebarComponent, HNavbarComponent, BackButtonDirective, RouterLink, DatePipe]
})
export class DShowAutorComponent implements OnInit {

  mAutor: any = {};

  mIdx = ""

  constructor(public mRenderer: Renderer2, private mRouter: Router, private mActivatedRoute: ActivatedRoute, private mAutorService: AutorService,
    private mSToastService: SToastService, private mSModalLoadingService: SModalLoadingService) {

    let mEventClose = this.mSModalLoadingService.show();
    this.mActivatedRoute.params.subscribe(params => {

      this.mIdx = params['idx'];

      this.mAutorService.get(this.mIdx).subscribe({
        error: (err: any) => {

          switch (err.error['code']) {
            default:
              this.mSToastService.danger(`Error inesperado, intenta mas tarde (Code: 01)`);
              break;
          }
        },
        next: (result: any) => {
          this.mAutor = result.autor;
        },
      }).add(() => {
        mEventClose.next();
      });

    });
  }

  ngOnInit(): void {
  }

}
