import { Component, OnInit, Renderer2 } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";

import { AutorModel } from 'src/app/models/autor.model';
import { AutorService } from 'src/app/services/autor.service';
import { SToastService } from 'src/app/components/shared/s-toast/s-toast.service';
import { SModalLoadingService } from 'src/app/components/shared/s-modal-loading/s-modal-loading.service';
import { HSidebarComponent } from '../../../home/h-sidebar/h-sidebar.component';
import { HNavbarComponent } from '../../../home/h-navbar/h-navbar.component';
import { DFormAutorComponent } from '../d-form-autor/d-form-autor.component';


@Component({
    selector: 'app-d-edit-autor',
    templateUrl: './d-edit-autor.component.html',
    imports: [HSidebarComponent, HNavbarComponent, DFormAutorComponent]
})
export class DEditAutorComponent implements OnInit {
  mAutor: AutorModel = new AutorModel();

  mIdx = ""

  disabled = false;

  constructor(public mRenderer: Renderer2, private mRouter: Router, private mActivatedRoute: ActivatedRoute, private mAutorService: AutorService,
    private mSToastService: SToastService, private mSModalLoadingService: SModalLoadingService) {

    let mEventClose = this.mSModalLoadingService.show();
    this.mActivatedRoute.params.subscribe(params => {

      this.mIdx = params['idx'];

      this.mAutorService.get(this.mIdx).subscribe({
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
          this.mAutor = result.autor;
        }

      }).add(() => {
        mEventClose.next();
      });

    });
  }

  ngOnInit(): void {
  }

  save(mAutor: AutorModel) {
    this.mAutor = mAutor;

    let mEventClose = this.mSModalLoadingService.show();
    this.mAutorService.update(this.mAutor, this.mIdx).subscribe({
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
        this.mRouter.navigate(['/autors']);
      }

    }).add(() => {
      mEventClose.next();
    });
  }
}
