import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-s-toast',
  templateUrl: './s-toast.component.html',
  imports: [LucideAngularModule],
})
export class SToastComponent implements OnInit, OnDestroy {

  @Input() mTitle: string = '';
  @Input() mText: string = '';
  @Input() mClassType: string = 'primary';
  @Input() mDone!: Subject<void>;

  mShow = signal<boolean>(false);

  private mHideTimer?: ReturnType<typeof setTimeout>;
  private mDestroyTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.mShow.set(true);
    this.mHideTimer = setTimeout(() => {
      this.mShow.set(false);
      this.mDestroyTimer = setTimeout(() => this.mDone?.next(), 400);
    }, 5000);
  }

  close(): void {
    if (this.mHideTimer) clearTimeout(this.mHideTimer);
    if (this.mDestroyTimer) clearTimeout(this.mDestroyTimer);
    this.mShow.set(false);
    this.mDestroyTimer = setTimeout(() => this.mDone?.next(), 400);
  }

  ngOnDestroy(): void {
    if (this.mHideTimer) clearTimeout(this.mHideTimer);
    if (this.mDestroyTimer) clearTimeout(this.mDestroyTimer);
  }
}
