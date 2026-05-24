import { AfterViewInit, Component, effect, ElementRef, NgZone, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import gsap from 'gsap';
import { MqttService } from 'src/app/services/mqtt.service';
import { EncapsulationHtmlPipe } from '../../../pipes/encapsulation-html.pipe';
import { animateIn, animateOut } from 'src/app/lib/slide-animations';

@Component({
  selector: 'app-h-presenter',
  templateUrl: './h-presenter.component.html',
  imports: [EncapsulationHtmlPipe],
})
export class HPresenterComponent implements OnInit, AfterViewInit, OnDestroy {

  private subscription?: Subscription;
  private mTopicName = 'blesong';

  mCurrentSlide = signal<string>('');
  mFontSize = signal<number>(80);
  mAnimationType = signal<number>(0);
  mHasContent = signal<boolean>(false);

  @ViewChild('slideText') slideTextRef?: ElementRef<HTMLDivElement>;

  constructor(private mMqttService: MqttService, private zone: NgZone) {
    effect(() => {
      const slide = this.mCurrentSlide();
      const mode = this.mAnimationType();
      if (!slide) return;
      this.zone.runOutsideAngular(() => {
        requestAnimationFrame(() => animateIn(this.slideTextRef?.nativeElement, mode));
      });
    });
  }

  ngOnInit(): void {
    // Make html + body transparent so OBS sees only the text.
    document.documentElement.classList.add('obs-overlay');

    this.subscription = this.mMqttService.messageReceived$.subscribe(({ message }) => {
      this.zone.run(() => {
        try {
          const data = JSON.parse(message);
          const array: string[] = data?.song_array ?? [];
          const idx: number = data?.song_slide_selected ?? 0;
          const nextSlide = array[idx] ?? '';
          const fontSize = data?.template?.template_body_fontsize ?? 80;
          const animType = data?.template?.template_animation ?? 0;

          // Fade out, then update signals — the effect() replays the intro.
          this.zone.runOutsideAngular(async () => {
            await animateOut(this.slideTextRef?.nativeElement);
            this.zone.run(() => {
              this.mFontSize.set(fontSize);
              this.mAnimationType.set(animType);
              this.mCurrentSlide.set(nextSlide);
              this.mHasContent.set(!!nextSlide?.trim?.());
            });
          });
        } catch (err) {
          console.error('Invalid MQTT payload', err);
        }
      });
    });

    this.mMqttService.subscribe(this.mTopicName);
  }

  ngAfterViewInit(): void {
    if (this.mHasContent()) {
      requestAnimationFrame(() => animateIn(this.slideTextRef?.nativeElement, this.mAnimationType()));
    }
  }

  ngOnDestroy(): void {
    document.documentElement.classList.remove('obs-overlay');
    this.subscription?.unsubscribe();
    if (this.slideTextRef) {
      gsap.killTweensOf(this.slideTextRef.nativeElement);
      gsap.killTweensOf(this.slideTextRef.nativeElement.querySelectorAll('*'));
    }
  }
}
