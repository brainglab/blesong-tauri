import { ApplicationRef, ComponentFactoryResolver, Injectable, Injector, EventEmitter, } from '@angular/core';
import { Subject } from 'rxjs';
import { DLoadSongComponent } from './d-load-song.component';

@Injectable({
  providedIn: 'root',
})
export class DLoadSongService {
  constructor(private injector: Injector, private applicationRef: ApplicationRef, private componentFactoryResolver: ComponentFactoryResolver) {

  }

  show() {
    const mResponseEvent = new Subject<boolean>();

    const mDialog = document.createElement('app-d-load-song');
    const mFactoryDialog = this.componentFactoryResolver.resolveComponentFactory(DLoadSongComponent);
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
