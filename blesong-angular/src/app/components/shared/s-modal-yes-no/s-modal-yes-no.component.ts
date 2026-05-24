import { Component, Input, OnInit, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-s-modal-yes-no',
  templateUrl: './s-modal-yes-no.component.html',
  imports: [LucideAngularModule],
})
export class SModalYesNoComponent implements OnInit {

  @Input() mTitle!: string;
  @Input() mText!: string;
  @Input() mResponseEvent!: Subject<boolean>;

  mClassType: string = 'default';
  mShow = signal<boolean>(false);

  ngOnInit(): void {
    this.mShow.set(true);
  }

  close(mResponse: boolean) {
    this.mShow.set(false);
    setTimeout(() => this.mResponseEvent.next(mResponse), 200);
  }
}
