import { Component, Input, OnInit, ElementRef, Renderer2 } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-s-modal-loading',
  templateUrl: './s-modal-loading.component.html',
  styleUrls: ['./s-modal-loading.component.css']
})
export class SModalLoadingComponent implements OnInit {

  @Input() mResponseEvent: Subject<void>;

  mClassType: string = 'default';
  mShow: boolean = false;

  constructor(public mRenderer: Renderer2, private elementRef: ElementRef) { }

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
