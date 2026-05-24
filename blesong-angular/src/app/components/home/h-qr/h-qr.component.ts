import { Component, OnInit, signal } from '@angular/core';
import { ServerService } from 'src/app/services/server.service';
import { SToastService } from '../../shared/s-toast/s-toast.service';
import { QRCodeComponent } from 'angularx-qrcode';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-h-qr',
  templateUrl: './h-qr.component.html',
  imports: [QRCodeComponent, LucideAngularModule],
})
export class HQrComponent implements OnInit {

  mCurrentUrl = signal<string>('');
  mIsLoading = signal<boolean>(true);
  mHasError = signal<boolean>(false);
  mIsLoopback = signal<boolean>(false);

  constructor(
    private mSToastService: SToastService,
    private serverService: ServerService,
  ) {}

  ngOnInit(): void {
    this.serverService.get().subscribe({
      error: () => {
        this.mIsLoading.set(false);
        this.mHasError.set(true);
      },
      next: (result: any) => {
        this.mIsLoading.set(false);
        if (result?.ip && result?.port) {
          this.mCurrentUrl.set(`http://${result.ip}:${result.port}/presenter/qr-menu`);
          // 127.0.0.1 means the host couldn't detect a LAN interface — the
          // QR still works for browsers on the same machine but not for
          // phones on the same WiFi. Warn but don't hide.
          this.mIsLoopback.set(result.ip === '127.0.0.1');
        } else {
          this.mHasError.set(true);
        }
      },
    });
  }

  async mCopyToClipboard() {
    const url = this.mCurrentUrl();
    if (!url) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const tmp = document.createElement('textarea');
        tmp.value = url;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        document.body.removeChild(tmp);
      }
      this.mSToastService.success('Enlace copiado al portapapeles');
    } catch (err) {
      this.mSToastService.danger('No se pudo copiar al portapapeles');
      console.error('clipboard error:', err);
    }
  }
}
