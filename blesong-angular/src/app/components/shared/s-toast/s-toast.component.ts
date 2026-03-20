import { Component, Input, OnInit, ElementRef } from '@angular/core';

@Component({
  selector: 'app-s-toast',
  templateUrl: './s-toast.component.html',
  styleUrls: ['./s-toast.component.css']
})
export class SToastComponent implements OnInit {

  @Input() mTitle: string = '';
  @Input() mText: string = '';

  mClassType: string = 'primary';
  mShow: boolean = false;

  constructor(private elementRef: ElementRef) { }

  ngOnInit(): void {

    this.mShow = true;
    this.destroy();

  }

  close() {
    this.mShow = false;
    let mTimeTwo = setTimeout(() => {
      this.elementRef.nativeElement.remove();
      clearInterval(mTimeTwo);
    }, 400);
  }

  destroy() {
    let mTimeOne = setTimeout(() => {
      this.mShow = false;
      let mTimeTwo = setTimeout(() => {
        this.elementRef.nativeElement.remove();
        clearInterval(mTimeTwo);
      }, 400);
      clearInterval(mTimeOne);
    }, 5000);
  }

}
