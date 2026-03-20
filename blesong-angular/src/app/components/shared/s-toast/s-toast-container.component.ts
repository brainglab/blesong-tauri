import { Component, OnInit, ViewContainerRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-s-toast-container',
  template: '<div class="toast-container position-fixed top-0 end-0 p-5 my-10" style="z-index: 11" id="toast-container"></div>'
})
export class SToastContainerComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
  }

}
