import { ApplicationRef, createComponent, Injectable, Injector } from '@angular/core';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { SModalLoadingComponent } from './s-modal-loading.component';

@Injectable({ providedIn: 'root' })
export class SModalLoadingService {

  constructor(private injector: Injector, private applicationRef: ApplicationRef) {}

  show(): Subject<void> {
    const mEventClose = new Subject<void>();

    const host = document.createElement('div');
    const ref = createComponent(SModalLoadingComponent, {
      environmentInjector: this.applicationRef.injector,
      elementInjector: this.injector,
      hostElement: host,
    });
    ref.instance.mResponseEvent = mEventClose;

    // Let the caller's "close" propagate to the component (which flips mShow
    // for the CSS exit animation), then destroy. ComponentRef.destroy()
    // detaches the view from ApplicationRef internally — no need for a
    // separate detachView() call.
    mEventClose.pipe(take(1)).subscribe(() => {
      setTimeout(() => {
        ref.destroy();
        host.remove();
      }, 250);
    });

    this.applicationRef.attachView(ref.hostView);
    document.body.appendChild(host);

    return mEventClose;
  }
}
