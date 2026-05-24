import { ApplicationRef, ComponentRef, createComponent, Injectable, Injector } from '@angular/core';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { SToastComponent } from './s-toast.component';
import { SToastContainerComponent } from './s-toast-container.component';

@Injectable({ providedIn: 'root' })
export class SToastService {

  private containerRef: ComponentRef<SToastContainerComponent> | null = null;

  constructor(private injector: Injector, private applicationRef: ApplicationRef) {}

  success(modalText: string, modalTitle: string = '') { this.show('success', modalText, modalTitle); }
  info(modalText: string, modalTitle: string = '') { this.show('info', modalText, modalTitle); }
  warning(modalText: string, modalTitle: string = '') { this.show('warning', modalText, modalTitle); }
  danger(modalText: string, modalTitle: string = '') { this.show('danger', modalText, modalTitle); }

  private ensureContainer(): HTMLElement {
    let nodeElement = document.getElementById('toast-container');
    if (nodeElement) return nodeElement;

    const containerHost = document.createElement('div');
    this.containerRef = createComponent(SToastContainerComponent, {
      environmentInjector: this.applicationRef.injector,
      elementInjector: this.injector,
      hostElement: containerHost,
    });
    this.applicationRef.attachView(this.containerRef.hostView);
    document.body.appendChild(containerHost);

    return document.getElementById('toast-container')!;
  }

  private show(mClass: string, modalText: string, modalTitle: string): void {
    const containerEl = this.ensureContainer();

    const done = new Subject<void>();
    const host = document.createElement('div');
    const ref = createComponent(SToastComponent, {
      environmentInjector: this.applicationRef.injector,
      elementInjector: this.injector,
      hostElement: host,
    });
    ref.instance.mTitle = modalTitle;
    ref.instance.mText = modalText;
    ref.instance.mClassType = mClass;
    ref.instance.mDone = done;

    done.pipe(take(1)).subscribe(() => {
      ref.destroy();
      host.remove();
    });

    this.applicationRef.attachView(ref.hostView);
    containerEl.appendChild(host);
  }
}
