import { ApplicationRef, Injectable, Injector } from '@angular/core';
import { Subject } from 'rxjs';
import { SModalOptionComponent } from './s-modal-option.component';
import { createComponent } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SModalOptionService {

  constructor(private injector: Injector, private applicationRef: ApplicationRef) {

  }

  show(mTitle: string, mOptions: any[], mField: string) {

    const mResponseEvent = new Subject<any>();

    const mToast = document.createElement('div');
    const mToastRef = createComponent(SModalOptionComponent, {
      environmentInjector: this.applicationRef.injector,
      elementInjector: this.injector,
      hostElement: mToast
    });

    mToastRef.instance.mTitle = mTitle;
    mToastRef.instance.mOptions = mOptions;
    mToastRef.instance.mField = mField;
    mToastRef.instance.mResponseEvent = mResponseEvent;

    this.applicationRef.attachView(mToastRef.hostView);
    document.body.appendChild(mToast);

    return mResponseEvent;
  }
}