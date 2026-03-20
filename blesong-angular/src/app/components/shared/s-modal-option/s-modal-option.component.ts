import { Component, ElementRef, Input, OnInit, Renderer2, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-s-modal-option',
  templateUrl: './s-modal-option.component.html'
})
export class SModalOptionComponent implements OnInit, AfterViewInit {

  @Input() mTitle: string;
  @Input() mOptions: any[];
  @Input() mField: string;
  @Input() mResponseEvent: Subject<any>;
  @ViewChild('mSearchInput') mSearchInput: ElementRef;

  mShow: boolean = false;
  mSearchText: string = '';
  mFilteredOptions: any[] = [];

  constructor(public mRenderer: Renderer2, private elementRef: ElementRef) { }

  ngOnInit(): void {
    this.mShow = true;
    this.mFilteredOptions = [...this.mOptions];
  }

  ngAfterViewInit(): void {
    if (this.mSearchInput) {
      this.mSearchInput.nativeElement.focus();
    }
  }

  filterOptions() {
    if (!this.mSearchText) {
      this.mFilteredOptions = [...this.mOptions];
    } else {
      this.mFilteredOptions = this.mOptions.filter(option =>
        option.name.toLowerCase().includes(this.mSearchText.toLowerCase())
      );
    }
  }

  close(mResponse: any) {
    this.mShow = false;

    let mTimeTwo = setTimeout(() => {
      this.elementRef.nativeElement.remove();
      clearInterval(mTimeTwo);
      this.mResponseEvent.next(mResponse);
    }, 400);
  }

}
