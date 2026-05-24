import { Component, computed, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { RealtimeModel } from 'src/app/models/realtime.model';
import { TemplateModel } from 'src/app/models/template.model';
import { MqttService } from 'src/app/services/mqtt.service';
import { SLIDE_ANIMATIONS } from 'src/app/lib/slide-animations';

@Component({
  selector: 'app-h-presenter-obs-navbar',
  templateUrl: './h-presenter-obs-navbar.component.html',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
})
export class HPresenterObsNavbarComponent {

  readonly animations = SLIDE_ANIMATIONS;

  mTemplate = signal<TemplateModel>(new TemplateModel());
  mDrawerOpen = signal<boolean>(false);

  /** Display name of the currently selected animation, reactive. */
  mAnimationName = computed(() => {
    const id = this.mTemplate().template_animation;
    return this.animations.find(a => a.id === id)?.name ?? '—';
  });

  constructor(private mMqttService: MqttService) {
    this.getStoredTemplate();
  }

  private getStoredTemplate(): void {
    const stored = localStorage.getItem('mTemplate');
    if (stored) {
      this.mTemplate.set(JSON.parse(stored));
    } else {
      const t = new TemplateModel();
      t.template_animation = 0;
      t.template_body_fontsize = 80;
      localStorage.setItem('mTemplate', JSON.stringify(t));
      this.mTemplate.set(t);
    }
  }

  private persistTemplate(): void {
    localStorage.setItem('mTemplate', JSON.stringify(this.mTemplate()));
  }

  setAnimation(idx: number): void {
    this.mTemplate.set({ ...this.mTemplate(), template_animation: idx });
    this.persistTemplate();
  }

  setFontSize(action: 'add' | 'sub'): void {
    this.getStoredTemplate();
    const current = this.mTemplate();
    const next = action === 'add'
      ? current.template_body_fontsize + 5
      : Math.max(10, current.template_body_fontsize - 5);
    this.mTemplate.set({ ...current, template_body_fontsize: next });
    this.persistTemplate();
  }

  sendStandBy(): void {
    this.getStoredTemplate();
    const realtime = new RealtimeModel();
    realtime.song_array = [''];
    realtime.song_slide_selected = 0;
    realtime.template = this.mTemplate();
    this.mMqttService.publish('blesong', JSON.stringify(realtime));
  }

  reload(): void {
    window.location.reload();
  }

  @HostListener('document:keydown.escape')
  closeDrawer(): void {
    if (this.mDrawerOpen()) this.mDrawerOpen.set(false);
  }
}
