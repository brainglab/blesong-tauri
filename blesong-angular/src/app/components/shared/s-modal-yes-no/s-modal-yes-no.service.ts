import { ApplicationRef, createComponent, Injectable, Injector } from '@angular/core';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { SModalYesNoComponent } from './s-modal-yes-no.component';

@Injectable({ providedIn: 'root' })
export class SModalYesNoService {

  constructor(private injector: Injector, private applicationRef: ApplicationRef) {}

  success(modalText: string, modalTitle: string = 'Atención') {
    return this.show('success', modalTitle, modalText);
  }

  info(modalText: string, modalTitle: string = 'Atención') {
    return this.show('info', modalTitle, modalText);
  }

  warning(modalText: string, modalTitle: string = 'Atención') {
    return this.show('warning', modalTitle, modalText);
  }

  danger(modalText: string, modalTitle: string = 'Atención') {
    return this.show('danger', modalText, modalTitle);
  }

  question(modalText: string, modalTitle: string = 'Atención') {
    return this.show('question', modalText, modalTitle);
  }

  private show(mClass: string, modalText: string, modalTitle: string): Subject<boolean> {
    const mResponseEvent = new Subject<boolean>();

    const host = document.createElement('div');
    const ref = createComponent(SModalYesNoComponent, {
      environmentInjector: this.applicationRef.injector,
      elementInjector: this.injector,
      hostElement: host,
    });
    ref.instance.mTitle = modalTitle;
    ref.instance.mText = modalText;
    ref.instance.mClassType = mClass;
    ref.instance.mResponseEvent = mResponseEvent;

    mResponseEvent.pipe(take(1)).subscribe(() => {
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
