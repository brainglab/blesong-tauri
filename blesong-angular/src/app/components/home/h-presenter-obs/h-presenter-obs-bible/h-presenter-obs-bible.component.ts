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
import { BibleBibleService } from 'src/app/services/bible_bible.service';
import { BibleBibleModel } from 'src/app/models/bible_bible.model';
import { BibleBookModel } from 'src/app/models/bible_book.model';
import { BibleBooksReferenceModel } from 'src/app/models/bible_books_reference.model';
import { BibleVerseModel } from 'src/app/models/bible_verse.model';

@Component({
  selector: 'app-h-presenter-obs-bible',
  templateUrl: './h-presenter-obs-bible.component.html',
})
export class HPresenterObsBibleComponent implements OnInit {

  mRealtime: RealtimeModel = new RealtimeModel();
  mTemplate: TemplateModel = new TemplateModel();
  mBibleBibles: BibleBibleModel[] = [];
  mBibleBooks: BibleBookModel[] = [];
  mBibleChapters: string[] = [];
  mBibleVerses: BibleVerseModel[] = [];

  mSelectedBible: BibleBibleModel | null = null;
  mSelectedBook: BibleBookModel | null = null;
  mSelectedChapter: number | null = null;
  mVerseIndex: number | null = null;

  mValidators = Validators;

  constructor(public mRenderer: Renderer2, private mRouter: Router, private mFormBuilder: FormBuilder, private mSToastService: SToastService,
    private mSModalLoadingService: SModalLoadingService, private mSModalYesNoService: SModalYesNoService, private mActivatedRoute: ActivatedRoute,
    private mSongService: SongService, private mMqttService: MqttService, private mSModalOptionService: SModalOptionService,
    private mBibleBibleService: BibleBibleService) {

    this.getStoredTemplate();
  }

  ngOnInit(): void {
    this.getBibles();
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

  mResetSelection() {
    this.mSelectedBible = null;
    this.mSelectedBook = null;
    this.mSelectedChapter = null;
    this.mVerseIndex = null;
    setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
  }

  getBibles() {
    let mEventClose = this.mSModalLoadingService.show();
    this.mBibleBibleService.selection().subscribe({
      error: (err: any) => {

        switch (err.error['code']) {
          default:
            this.mSToastService.danger(`Error inesperado, intenta mas tarde (Code: 01)`);
            break;
        }
      },
      next: (result: any) => {

        this.mBibleBibles = result.bible_bibles;
        setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
      }

    }).add(() => {
      mEventClose.next();
    });
  }

  setBible(mBibleBible: BibleBibleModel) {
    this.mSelectedBible = mBibleBible;
    this.getBooks();
  }

  getBooks() {
    let mEventClose = this.mSModalLoadingService.show();
    this.mBibleBibleService.selectionBooks(this.mSelectedBible?.idx).subscribe({
      error: (err: any) => {

        switch (err.error['code']) {
          default:
            this.mSToastService.danger(`Error inesperado, intenta mas tarde (Code: 01)`);
            break;
        }
      },
      next: (result: any) => {

        this.mBibleBooks = result.bible_books;
        setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
      }

    }).add(() => {
      mEventClose.next();
    });
  }

  setBook(mBibleBook: BibleBookModel) {
    this.mSelectedBook = mBibleBook;
    this.getChapters();
  }

  getChapters() {
    let mEventClose = this.mSModalLoadingService.show();
    this.mBibleBibleService.selectionChapters(this.mSelectedBible?.idx, this.mSelectedBook?.idx).subscribe({
      error: (err: any) => {

        switch (err.error['code']) {
          default:
            this.mSToastService.danger(`Error inesperado, intenta mas tarde (Code: 01)`);
            break;
        }
      },
      next: (result: any) => {

        this.mBibleChapters = result.bible_chapters;
        setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
      }

    }).add(() => {
      mEventClose.next();
    });
  }

  setChapter(mChapter: number) {
    this.mSelectedChapter = mChapter;
    this.getVerses();
  }

  getVerses() {
    let mEventClose = this.mSModalLoadingService.show();
    this.mBibleBibleService.selectionVerses(this.mSelectedBible?.idx, this.mSelectedBook?.idx, this.mSelectedChapter.toString()).subscribe({
      error: (err: any) => {

        switch (err.error['code']) {
          default:
            this.mSToastService.danger(`Error inesperado, intenta mas tarde (Code: 01)`);
            break;
        }
      },
      next: (result: any) => {

        this.mBibleVerses = result.bible_verses;
        setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
      }

    }).add(() => {
      mEventClose.next();
    });
  }

  setVerse(mText: string, mIndex: number) {

    this.getStoredTemplate();

    this.mVerseIndex = mIndex;

    this.mRealtime.song_array = [`${mText} <br> (${this.mSelectedBook?.name} ${this.mSelectedChapter}:${this.mBibleVerses[mIndex].verse} ${this.mSelectedBible?.abreviation})`];
    this.mRealtime.song_slide_selected = 0;
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
