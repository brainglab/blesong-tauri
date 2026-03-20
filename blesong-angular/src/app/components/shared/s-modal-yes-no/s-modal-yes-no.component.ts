import { Component, Input, OnInit, ElementRef, Renderer2, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-s-modal-yes-no',
  templateUrl: './s-modal-yes-no.component.html',
  styleUrls: ['./s-modal-yes-no.component.css']
})
export class SModalYesNoComponent implements OnInit {

  @Input() mTitle: string;
  @Input() mText: string;
  @Input() mResponseEvent: Subject<boolean>;

  mClassType: string = 'default';
  mShow: boolean = false;

  constructor(public mRenderer: Renderer2, private elementRef: ElementRef) { }

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
