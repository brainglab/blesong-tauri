import { Component, Input, OnInit, ElementRef, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-s-modal-yes-no',
    templateUrl: './s-modal-yes-no.component.html',
    imports: [LucideAngularModule]
})
export class SModalYesNoComponent implements OnInit {

  @Input() mTitle: string;
  @Input() mText: string;
  @Input() mResponseEvent: Subject<boolean>;

  mClassType: string = 'default';
  mShow: boolean = false;

  constructor(private elementRef: ElementRef) { }

  ngOnInit(): void {
    this.mShow = true;
  }

  close(mResponse: boolean) {
    this.mShow = false;

    let mTimeTwo = setTimeout(() => {
      this.elementRef.nativeElement.remove();
      clearInterval(mTimeTwo);
      this.mResponseEvent.next(mResponse);
    }, 400);
  }

}
