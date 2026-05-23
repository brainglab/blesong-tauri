import { Component, OnInit, ViewContainerRef, ViewChild } from '@angular/core';

@Component({
    selector: 'app-s-toast-container',
    template: '<div class="toast toast-top toast-end z-50 p-4 space-y-2" id="toast-container"></div>'
})
export class SToastContainerComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
  }

}
