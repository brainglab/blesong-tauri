import { Component, Input, OnInit, ElementRef } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-s-modal-loading',
    templateUrl: './s-modal-loading.component.html',
    imports: []
})
export class SModalLoadingComponent implements OnInit {

  @Input() mResponseEvent: Subject<void>;

  mClassType: string = 'default';
  mShow: boolean = false;

  constructor(private elementRef: ElementRef) { }

  ngOnInit(): void {
    this.mShow = true;

    this.mResponseEvent.subscribe(() => {
      this.close();
    });
  }

  close() {
    this.mShow = false;

    let mTimeTwo = setTimeout(() => {
      this.elementRef.nativeElement.remove();
      clearInterval(mTimeTwo);
    }, 400);
  }

}
