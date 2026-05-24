import { ApplicationRef, createComponent, Injectable, Injector } from '@angular/core';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { SModalOptionComponent } from './s-modal-option.component';

@Injectable({ providedIn: 'root' })
export class SModalOptionService {

  constructor(private injector: Injector, private applicationRef: ApplicationRef) {}

  show(mTitle: string, mOptions: any[], mField: string): Subject<any> {
    const mResponseEvent = new Subject<any>();

    const host = document.createElement('div');
    const ref = createComponent(SModalOptionComponent, {
      environmentInjector: this.applicationRef.injector,
      elementInjector: this.injector,
      hostElement: host,
    });
    ref.instance.mTitle = mTitle;
    ref.instance.mOptions = mOptions;
    ref.instance.mField = mField;
    ref.instance.mResponseEvent = mResponseEvent;

    mResponseEvent.pipe(take(1)).subscribe(() => {
      // wait for the modal's close animation before tearing the view down
      setTimeout(() => {
        ref.destroy();
        host.remove();
      }, 250);
    });

    this.applicationRef.attachView(ref.hostView);
    document.body.appendChild(host);

    return mResponseEvent;
  }
}
