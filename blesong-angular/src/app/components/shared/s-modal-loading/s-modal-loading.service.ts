import { ApplicationRef, ComponentFactoryResolver, Injectable, Injector, EventEmitter } from '@angular/core';
import { SModalLoadingComponent } from './s-modal-loading.component';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SModalLoadingService {

  constructor(private injector: Injector, private applicationRef: ApplicationRef, private componentFactoryResolver: ComponentFactoryResolver) {

  }

  show() {

    const mEventClose = new Subject<void>();

    const mToast = document.createElement('app-s-modal-yes-no');
    const mFactoryToast = this.componentFactoryResolver.resolveComponentFactory(SModalLoadingComponent);
    const mToastRef = mFactoryToast.create(this.injector, [], mToast);
    mToastRef.instance.mResponseEvent = mEventClose;

    this.applicationRef.attachView(mToastRef.hostView);
    document.body.appendChild(mToast);

    return mEventClose;
  }
}