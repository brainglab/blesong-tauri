import { Component, OnInit } from '@angular/core';
import { ServerService } from 'src/app/services/server.service';
import { SToastService } from '../../shared/s-toast/s-toast.service';
import { SModalLoadingService } from '../../shared/s-modal-loading/s-modal-loading.service';

@Component({
  selector: 'app-h-qr',
  templateUrl: './h-qr.component.html',
})
export class HQrComponent implements OnInit {

  mCurrentUrl: string = '';

  constructor(private mSToastService: SToastService, private mSModalLoadingService: SModalLoadingService, private serverService: ServerService) { }


  ngOnInit(): void {

    let mEventClose = this.mSModalLoadingService.show();
    this.serverService.get().subscribe({
      error: (err: any) => {

        switch (err.error['code']) {
          default:
            this.mSToastService.danger(`Error inesperado, intenta mas tarde (Code: 01)`);
            break;
        }
      },
      next: (result: any) => {


        // result
        if (result && result.ip && result.port) {
          // Usar la IP y puerto del servidor (8080) para que dispositivos
          // externos puedan acceder al frontend servido por axum
          this.mCurrentUrl = `http://${result.ip}:${result.port}/presenter/qr-menu`;
        } else {
          // Fallback: usar la url actual
          this.mCurrentUrl = window.location.origin + '/presenter/qr-menu';
        }

      },
    }).add(() => {
      mEventClose.next();
    });
  }

  async mCopyToClipboard() {
    try {
      // Intentar primero con la API moderna del portapapeles
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(this.mCurrentUrl);
      } else {
        // Solución alternativa usando un elemento temporal
        const mTempElement = document.createElement('textarea');
        mTempElement.value = this.mCurrentUrl;
        document.body.appendChild(mTempElement);
        mTempElement.select();
        document.execCommand('copy');
        document.body.removeChild(mTempElement);
      }

      this.mSToastService.success('¡Enlace copiado al portapapeles!');

    } catch (err) {
      this.mSToastService.danger('Error al copiar al portapapeles');
      console.error('Error al copiar al portapapeles:', err);
    }
  }
}
