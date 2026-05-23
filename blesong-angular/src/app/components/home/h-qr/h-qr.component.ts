import { Component, OnInit } from '@angular/core';
import { ServerService } from 'src/app/services/server.service';
import { SToastService } from '../../shared/s-toast/s-toast.service';
import { SModalLoadingService } from '../../shared/s-modal-loading/s-modal-loading.service';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
    selector: 'app-h-qr',
    templateUrl: './h-qr.component.html',
    imports: [QRCodeComponent]
})
export class HQrComponent implements OnInit {

  mCurrentUrl: string = '';

  constructor(private mSToastService: SToastService, private mSModalLoadingService: SModalLoadingService, private serverService: ServerService) { }


  ngOnInit(): void {

    let mEventClose = this.mSModalLoadingService.show();
    this.serverService.get().subscribe({
      error: () => {
        this.mCurrentUrl = '';
        this.mSToastService.danger('No se pudo obtener la IP local del servidor');
      },
      next: (result: any) => {
        // El QR sólo es útil si la app está expuesta en una IP de LAN real.
        // Si get_local_ip() en el backend no detectó NIC y cayó a 127.0.0.1,
        // un teléfono no puede alcanzarla — mostramos error en vez de un QR roto.
        if (result?.ip && result?.port && result.ip !== '127.0.0.1') {
          this.mCurrentUrl = `http://${result.ip}:${result.port}/presenter/qr-menu`;
        } else {
          this.mCurrentUrl = '';
          this.mSToastService.danger('No se detectó red local activa. Conéctate a una red WiFi/LAN y reintenta.');
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
