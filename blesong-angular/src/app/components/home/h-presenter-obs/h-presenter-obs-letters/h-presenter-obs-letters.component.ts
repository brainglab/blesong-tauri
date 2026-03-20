import { Component, OnInit, Renderer2, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

@Component({
  selector: 'app-h-presenter-obs-letters',
  templateUrl: './h-presenter-obs-letters.component.html'
})
export class HPresenterObsLettersComponent {

  mForm: FormGroup;
  mOptionsSongIdx = []
  mSong: SongModel = new SongModel();
  mSongIndex = -1;
  mSongArray = [];
  mSongIdx = null;

  mTypeAnimation: [{ idx: 0, type: 'Suave' }, { idx: 1, type: 'Brillante' }];

  mOptionText = { "song_idx": "" };

  mRealtime: RealtimeModel = new RealtimeModel();
  mTemplate: TemplateModel = new TemplateModel();

  mValidators = Validators;

  constructor(public mRenderer: Renderer2, private mRouter: Router, private mFormBuilder: FormBuilder, private mSToastService: SToastService,
    private mSModalLoadingService: SModalLoadingService, private mSModalYesNoService: SModalYesNoService, private mActivatedRoute: ActivatedRoute,
    private mSongService: SongService, private mMqttService: MqttService, private mSModalOptionService: SModalOptionService,) {

    this.getStoredTemplate();
    this.buildForm();
    this.getSongs();
  }

  ngOnInit(): void {
  }

  getStoredTemplate() {
    // Obtener el template guardado de localStorage o crear uno nuevo si no existe
    let mStoredTemplate = localStorage.getItem('mTemplate');
    if (mStoredTemplate) {
      // Si existe, parsear el JSON almacenado
      this.mTemplate = JSON.parse(mStoredTemplate);
    } else {
      // Si no existe, crear un objeto vacío y guardarlo
      this.mTemplate = new TemplateModel();
      this.mTemplate.template_animation = 0;
      this.mTemplate.template_body_fontsize = 80;
      localStorage.setItem('mTemplate', JSON.stringify(this.mTemplate));
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.mSong && this.mOptionsSongIdx.length > 0) {
      const mSelectedSong = this.mOptionsSongIdx.find(opt => opt.idx.toString() === this.mSong.idx?.toString());
      this.mOptionText['song_idx'] = mSelectedSong ? mSelectedSong.name : '';
    }
  }

  showModalOption(mTitle: string, mOptions: any[], mField: string, mNull: boolean = false) {
    if (mNull) {
      this.mSong[mField] = null;
      this.mForm.get(mField)?.setValue(null);
      this.mOptionText[mField] = null;
    } else {
      let mResponseEvent = this.mSModalOptionService.show(mTitle, mOptions, mField);
      mResponseEvent.subscribe((response) => {
        if (response !== null) {
          console.log(`==> mField: ${mField}, response: ${JSON.stringify(response)}`);
          this.mSong[mField] = response;
          this.mOptionText[mField] = mOptions.find(opt => opt.idx == response)?.name;

          if (mField == 'song_idx') {
            this.mSongIdx = response;
            this.setSong();
          }
        }
      });
    }
  }

  getSongs() {
    // get SongIdx 
    // ----------------------------------------------------------------------------- 

    let mSong = new SongModel();
    mSong.song_name = this.mForm.get('song_idx').value;
    mSong.autor_idx = null
    mSong.song_year = null
    mSong.song_content = null

    let mOrder = new OrderModel();
    mOrder.order_field = 'song_name';
    mOrder.order_direction = 'ASC';
    mOrder.order_count = 30;

    let mEventLoadingScreenAutor = this.mSModalLoadingService.show();
    this.mSongService.selection(mSong, mOrder, 0).subscribe((result: any) => {
      if (result['code'] != '00') {
        this.mSToastService.danger("Error inesperado");
      } else if (result['code'] == '00') {
        console.log(`==> result: ${JSON.stringify(result)}`);
        this.mOptionsSongIdx = result.songs;
      }
    }).add(() => {
      mEventLoadingScreenAutor.next();
    });
  }

  buildForm() {
    this.mForm = this.mFormBuilder.group({
      song_idx: ['', [Validators.maxLength(255), Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s]+[^\'\"]*$/)]],
      template_animation: [0, [Validators.required]]
    })
  }

  get mSongIdxValid() { return this.mForm.get('song_idx').invalid && this.mForm.get('song_idx').touched }
  get mTemplateAnimationValid() { return this.mForm.get('template_animation').invalid && this.mForm.get('template_animation').touched }

  setSong() {
    console.log(`==> mSongIdx: ${this.mSongIdx}`)

    if (this.mSongIdx == null) {
      this.mSongIndex = -1;
      this.mSongArray = [];

    } else {

      let mEventClose = this.mSModalLoadingService.show();
      this.mSongService.get(this.mSongIdx).subscribe({
        error: (err: any) => {
          console.log(`==> err: ${JSON.stringify(err)}`);
          switch (err.error['code']) {
            default:
              this.mSToastService.danger(`Error inesperado, intenta mas tarde (Code: 01)`);
              break;
          }
        },
        next: (result: any) => {

          // result
          this.mSong = result.song;
          this.mSongIndex = -1;
          this.mSongArray = this.mSong.song_content.split('***');

          // Force OBS embedded browser to recalculate scroll height
          setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
        },
      }).add(() => {
        mEventClose.next();
      });

    }
  }

  setSongPart(mIndex: number) {

    this.getStoredTemplate();

    this.mSongIndex = mIndex

    this.mRealtime.song_array = this.mSongArray;
    this.mRealtime.song_slide_selected = this.mSongIndex;
    this.mRealtime.template = this.mTemplate;
    this.mMqttService.publish('blesong', JSON.stringify(this.mRealtime));
  }

  sendStandBy() {

    this.getStoredTemplate();

    let mRealtime = new RealtimeModel();
    mRealtime.song_array = [''];
    mRealtime.song_slide_selected = 0;
    this.mRealtime.template = this.mTemplate;
    this.mMqttService.publish('blesong', JSON.stringify(mRealtime));
  }
}
