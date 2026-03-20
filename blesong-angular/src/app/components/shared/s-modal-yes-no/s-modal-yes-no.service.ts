import { ApplicationRef, ComponentFactoryResolver, Injectable, Injector, EventEmitter } from '@angular/core';
import { SModalYesNoComponent } from './s-modal-yes-no.component';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SModalYesNoService {

  constructor(private injector: Injector, private applicationRef: ApplicationRef, private componentFactoryResolver: ComponentFactoryResolver) {

  }

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

  private show(mClass: string, modalText: string, modalTitle: string) {

    const mResponseEvent = new Subject<boolean>();

    const mToast = document.createElement('app-s-modal-yes-no');
    const mFactoryToast = this.componentFactoryResolver.resolveComponentFactory(SModalYesNoComponent);
    const mToastRef = mFactoryToast.create(this.injector, [], mToast);
    mToastRef.instance.mTitle = modalTitle;
    mToastRef.instance.mText = modalText;
    mToastRef.instance.mClassType = mClass;
    mToastRef.instance.mResponseEvent = mResponseEvent;

    this.applicationRef.attachView(mToastRef.hostView);
    document.body.appendChild(mToast);

    return mResponseEvent;
  }

  removeDynamicComponent(component) {
    component.destroy();
  }
}