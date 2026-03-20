import { ApplicationRef, ComponentFactoryResolver, Injectable, Injector } from '@angular/core';
import { SToastComponent } from "./s-toast.component";
import { SToastContainerComponent } from './s-toast-container.component';

@Injectable({
  providedIn: 'root'
})
export class SToastService {

  constructor(private injector: Injector, private applicationRef: ApplicationRef, private componentFactoryResolver: ComponentFactoryResolver) {

  }

  success(modalText: string, modalTitle: string = '') {
    this.show('success', modalText, modalTitle);
  }

  info(modalText: string, modalTitle: string = '') {
    this.show('info', modalText, modalTitle);
  }

  warning(modalText: string, modalTitle: string = '') {
    this.show('warning', modalText, modalTitle);
  }

  danger(modalText: string, modalTitle: string = '') {
    this.show('danger', modalText, modalTitle);
  }

  private show(mClass: string, modalText: string, modalTitle: string) {

    let nodeElement = document.getElementById("toast-container");
    if (nodeElement == null) {
      const mToastContainer = document.createElement('app-s-toast-container');
      const mFactoryToastContainer = this.componentFactoryResolver.resolveComponentFactory(SToastContainerComponent);
      const mToastContainerRef = mFactoryToastContainer.create(this.injector, [], mToastContainer);

      this.applicationRef.attachView(mToastContainerRef.hostView);
      document.body.appendChild(mToastContainer);
    }

    nodeElement = document.getElementById("toast-container");
    const mToast = document.createElement('app-s-toast');
    const mFactoryToast = this.componentFactoryResolver.resolveComponentFactory(SToastComponent);
    const mToastRef = mFactoryToast.create(this.injector, [], mToast);
    mToastRef.instance.mTitle = modalTitle;
    mToastRef.instance.mText = modalText;
    mToastRef.instance.mClassType = mClass;

    this.applicationRef.attachView(mToastRef.hostView);
    nodeElement!.appendChild(mToast);
  }
}