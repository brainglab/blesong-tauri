import { ApplicationRef, ComponentFactoryResolver, Injectable, Injector, EventEmitter, } from '@angular/core';
import { Subject } from 'rxjs';
import { DLoadAutorComponent } from './d-load-autor.component';

@Injectable({
  providedIn: 'root',
})
export class DLoadAutorService {
  constructor(private injector: Injector, private applicationRef: ApplicationRef, private componentFactoryResolver: ComponentFactoryResolver) {

  }

  show() {
    const mResponseEvent = new Subject<boolean>();

    const mDialog = document.createElement('app-d-load-autor');
    const mFactoryDialog = this.componentFactoryResolver.resolveComponentFactory(DLoadAutorComponent);
    const mDialogRef = mFactoryDialog.create(this.injector, [], mDialog);
    mDialogRef.instance.mResponseEvent = mResponseEvent;

    this.applicationRef.attachView(mDialogRef.hostView);
    document.body.appendChild(mDialog);

    return mResponseEvent;
  }

  removeDynamicComponent(component) {
    component.destroy();
  }
}
