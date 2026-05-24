import { Component, Input, OnInit, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-s-modal-loading',
  templateUrl: './s-modal-loading.component.html',
  imports: [],
})
export class SModalLoadingComponent implements OnInit {

  @Input() mResponseEvent!: Subject<void>;

  // Signal so flipping visibility is isolated from sibling CD passes —
  // avoids NG0100 when other dynamic state mutates during the same tick.
  mShow = signal<boolean>(false);

  ngOnInit(): void {
    this.mShow.set(true);
    this.mResponseEvent?.subscribe(() => {
      this.mShow.set(false);
    });
  }
}
