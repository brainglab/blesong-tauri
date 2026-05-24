import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SModalYesNoService } from 'src/app/components/shared/s-modal-yes-no/s-modal-yes-no.service';
import { SToastService } from 'src/app/components/shared/s-toast/s-toast.service';
import { SModalLoadingService } from 'src/app/components/shared/s-modal-loading/s-modal-loading.service';
import { RealtimeModel } from 'src/app/models/realtime.model';
import { SongModel } from 'src/app/models/song.model';
import { SongService } from 'src/app/services/song.service';
import { OrderModel } from 'src/app/models/order.model';
import { MqttService } from 'src/app/services/mqtt.service';
import { SModalOptionService } from '../../../shared/s-modal-option/s-modal-option.service';
import { TemplateModel } from 'src/app/models/template.model';
import { LucideAngularModule } from 'lucide-angular';
import { EncapsulationHtmlPipe } from '../../../../pipes/encapsulation-html.pipe';

const STORAGE_SONG_KEY = 'mSelectedSongIdx';
const STORAGE_TEMPLATE_KEY = 'mTemplate';

@Component({
  selector: 'app-h-presenter-obs-letters',
  templateUrl: './h-presenter-obs-letters.component.html',
  imports: [ReactiveFormsModule, LucideAngularModule, EncapsulationHtmlPipe],
})
export class HPresenterObsLettersComponent {

  mForm: FormGroup;
  mOptionsSongIdx = [];

  mSong = signal<SongModel>(new SongModel());
  mSongArray = signal<string[]>([]);
  mSongIndex = signal<number>(-1);

  mSongIdx: any = null;
  mOptionText = { song_idx: '' };

  mRealtime: RealtimeModel = new RealtimeModel();
  mTemplate: TemplateModel = new TemplateModel();

  mValidators = Validators;

  constructor(
    private mRouter: Router,
    private mFormBuilder: FormBuilder,
    private mSToastService: SToastService,
    private mSModalLoadingService: SModalLoadingService,
    private mSModalYesNoService: SModalYesNoService,
    private mActivatedRoute: ActivatedRoute,
    private mSongService: SongService,
    private mMqttService: MqttService,
    private mSModalOptionService: SModalOptionService,
  ) {
    this.getStoredTemplate();
    this.buildForm();
    this.getSongs();

    // Restore last-selected song across refresh.
    const storedId = localStorage.getItem(STORAGE_SONG_KEY);
    if (storedId) {
      this.mSongIdx = storedId;
      this.setSong();
    }
  }

  // ------------------------------------------------------------ template

  private getStoredTemplate(): void {
    const stored = localStorage.getItem(STORAGE_TEMPLATE_KEY);
    if (stored) {
      this.mTemplate = JSON.parse(stored);
    } else {
      this.mTemplate = new TemplateModel();
      this.mTemplate.template_animation = 0;
      this.mTemplate.template_body_fontsize = 80;
      localStorage.setItem(STORAGE_TEMPLATE_KEY, JSON.stringify(this.mTemplate));
    }
  }

  // ------------------------------------------------------------ picker

  showModalOption(mTitle: string, mOptions: any[], mField: string, mNull: boolean = false) {
    if (mNull) {
      this.mSong.update(s => ({ ...s, [mField]: null }));
      this.mForm.get(mField)?.setValue('');
      this.mOptionText[mField] = '';

      if (mField === 'song_idx') {
        this.mSongIdx = null;
        localStorage.removeItem(STORAGE_SONG_KEY);
        this.mSongArray.set([]);
        this.mSongIndex.set(-1);
      }
      return;
    }

    const mResponseEvent = this.mSModalOptionService.show(mTitle, mOptions, mField);
    mResponseEvent.subscribe((response) => {
      if (response === null) return;

      this.mSong.update(s => ({ ...s, [mField]: response }));
      const name = mOptions.find(opt => opt.idx == response)?.name ?? '';
      this.mOptionText[mField] = name;
      this.mForm.get(mField)?.setValue(name);

      if (mField === 'song_idx') {
        this.mSongIdx = response;
        localStorage.setItem(STORAGE_SONG_KEY, String(response));
        this.setSong();
      }
    });
  }

  // ------------------------------------------------------------ data

  getSongs() {
    const mSong = new SongModel();
    mSong.song_name = this.mForm.get('song_idx').value;
    mSong.autor_idx = null;
    mSong.song_year = null;
    mSong.song_content = null;

    const mOrder = new OrderModel();
    mOrder.order_field = 'song_name';
    mOrder.order_direction = 'ASC';
    mOrder.order_count = 30;

    const close = this.mSModalLoadingService.show();
    this.mSongService.selection(mSong, mOrder, 0).subscribe((result: any) => {
      if (result['code'] !== '00') {
        this.mSToastService.danger('Error inesperado');
      } else {
        this.mOptionsSongIdx = result.songs;
      }
    }).add(() => close.next());
  }

  buildForm() {
    this.mForm = this.mFormBuilder.group({
      song_idx: ['', [Validators.maxLength(255), Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s]+[^\'\"]*$/)]],
      template_animation: [0, [Validators.required]],
    });
  }

  get mSongIdxValid() {
    return this.mForm.get('song_idx').invalid && this.mForm.get('song_idx').touched;
  }

  setSong() {
    if (this.mSongIdx == null) {
      this.mSongIndex.set(-1);
      this.mSongArray.set([]);
      return;
    }

    const close = this.mSModalLoadingService.show();
    this.mSongService.get(this.mSongIdx).subscribe({
      error: (err: any) => {
        switch (err.error['code']) {
          default:
            this.mSToastService.danger('Error inesperado, intenta mas tarde (Code: 01)');
            break;
        }
      },
      next: (result: any) => {
        const song: SongModel = result.song;
        this.mSong.set(song);
        this.mOptionText['song_idx'] = song.song_name ?? '';
        this.mForm.get('song_idx')?.setValue(song.song_name ?? '');
        this.mSongIndex.set(-1);
        this.mSongArray.set((song.song_content || '').split('***'));

        // Help OBS embedded browser recalculate scroll height.
        setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
      },
    }).add(() => close.next());
  }

  // ------------------------------------------------------------ publish

  setSongPart(mIndex: number) {
    this.getStoredTemplate();
    this.mSongIndex.set(mIndex);

    this.mRealtime.song_array = this.mSongArray();
    this.mRealtime.song_slide_selected = mIndex;
    this.mRealtime.template = this.mTemplate;
    this.mMqttService.publish('blesong', JSON.stringify(this.mRealtime));
  }

  sendStandBy() {
    this.getStoredTemplate();
    const realtime = new RealtimeModel();
    realtime.song_array = [''];
    realtime.song_slide_selected = 0;
    realtime.template = this.mTemplate;
    this.mMqttService.publish('blesong', JSON.stringify(realtime));
  }
}
