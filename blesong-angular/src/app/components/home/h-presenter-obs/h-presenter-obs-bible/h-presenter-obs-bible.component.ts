import { Component, computed, OnInit, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import {
  BibleBookItem,
  BibleChapterItem,
  BibleListItem,
  BibleService,
  BibleVerseItem,
} from 'src/app/services/bible.service';
import { MqttService } from 'src/app/services/mqtt.service';
import { RealtimeModel } from 'src/app/models/realtime.model';
import { TemplateModel } from 'src/app/models/template.model';
import { SModalLoadingService } from 'src/app/components/shared/s-modal-loading/s-modal-loading.service';
import { SToastService } from 'src/app/components/shared/s-toast/s-toast.service';

const STORAGE_BIBLE_KEY = 'mSelectedBibleIdx';
const STORAGE_TEMPLATE_KEY = 'mTemplate';

@Component({
  selector: 'app-h-presenter-obs-bible',
  templateUrl: './h-presenter-obs-bible.component.html',
  imports: [LucideAngularModule],
})
export class HPresenterObsBibleComponent implements OnInit {

  mBibles = signal<BibleListItem[]>([]);
  mSelectedBible = signal<BibleListItem | null>(null);

  mBooks = signal<BibleBookItem[]>([]);
  mSelectedBook = signal<BibleBookItem | null>(null);

  mChapters = signal<BibleChapterItem[]>([]);
  mSelectedChapter = signal<number | null>(null);

  mVerses = signal<BibleVerseItem[]>([]);
  mVerseIndex = signal<number>(-1);

  mTestament = signal<'AT' | 'NT' | 'ALL'>('ALL');

  filteredBooks = computed(() => {
    const t = this.mTestament();
    const all = this.mBooks();
    return t === 'ALL' ? all : all.filter(b => b.testament === t);
  });

  constructor(
    private mBibleService: BibleService,
    private mMqttService: MqttService,
    private mSModalLoadingService: SModalLoadingService,
    private mSToastService: SToastService,
  ) {}

  ngOnInit(): void {
    this.loadBibles();
  }

  private storedTemplate(): TemplateModel {
    const stored = localStorage.getItem(STORAGE_TEMPLATE_KEY);
    if (stored) return JSON.parse(stored);
    const t = new TemplateModel();
    t.template_animation = 0;
    t.template_body_fontsize = 80;
    return t;
  }

  // ------------------------------------------------------------ bibles

  private loadBibles(): void {
    const close = this.mSModalLoadingService.show();
    this.mBibleService.selection().subscribe({
      next: (result: any) => {
        const list: BibleListItem[] = result.bible_bibles ?? [];
        this.mBibles.set(list);
        // Restore previously selected bible across refresh.
        const storedIdx = localStorage.getItem(STORAGE_BIBLE_KEY);
        const restored = storedIdx ? list.find(b => b.idx === storedIdx) : null;
        if (restored) this.setBible(restored);
      },
      error: () => this.mSToastService.danger('No se pudieron cargar las biblias'),
    }).add(() => close.next());
  }

  setBible(bible: BibleListItem): void {
    this.mSelectedBible.set(bible);
    localStorage.setItem(STORAGE_BIBLE_KEY, bible.idx);
    this.mSelectedBook.set(null);
    this.mSelectedChapter.set(null);
    this.mVerses.set([]);
    this.mVerseIndex.set(-1);
    this.loadBooks(bible.idx);
  }

  private loadBooks(bibleIdx: string): void {
    const close = this.mSModalLoadingService.show();
    this.mBibleService.selectionBooks(bibleIdx).subscribe({
      next: (result: any) => this.mBooks.set(result.bible_books ?? []),
      error: () => this.mSToastService.danger('No se pudieron cargar los libros'),
    }).add(() => close.next());
  }

  // ------------------------------------------------------------ navigation

  setTestament(t: 'AT' | 'NT' | 'ALL'): void {
    this.mTestament.set(t);
  }

  setBook(book: BibleBookItem): void {
    this.mSelectedBook.set(book);
    this.mSelectedChapter.set(null);
    this.mVerses.set([]);
    this.mVerseIndex.set(-1);
    const bibleIdx = this.mSelectedBible()?.idx;
    if (!bibleIdx) return;

    const close = this.mSModalLoadingService.show();
    this.mBibleService.selectionChapters(bibleIdx, book.idx).subscribe({
      next: (result: any) => this.mChapters.set(result.bible_chapters ?? []),
      error: () => this.mSToastService.danger('No se pudieron cargar los capítulos'),
    }).add(() => close.next());
  }

  setChapter(chapter: number): void {
    this.mSelectedChapter.set(chapter);
    this.mVerseIndex.set(-1);
    const bibleIdx = this.mSelectedBible()?.idx;
    const bookIdx = this.mSelectedBook()?.idx;
    if (!bibleIdx || !bookIdx) return;

    const close = this.mSModalLoadingService.show();
    this.mBibleService.selectionVerses(bibleIdx, bookIdx, chapter).subscribe({
      next: (result: any) => this.mVerses.set(result.bible_verses ?? []),
      error: () => this.mSToastService.danger('No se pudieron cargar los versículos'),
    }).add(() => close.next());
  }

  // ------------------------------------------------------------ publish

  setVerse(verse: BibleVerseItem, index: number): void {
    const book = this.mSelectedBook();
    const bible = this.mSelectedBible();
    const chapter = this.mSelectedChapter();
    if (!book || !bible || chapter == null) return;

    this.mVerseIndex.set(index);

    const reference = `${book.name} ${chapter}:${verse.verse} (${bible.abreviation})`;
    const realtime = new RealtimeModel();
    realtime.song_array = [`${verse.text}\n\n${reference}`];
    realtime.song_slide_selected = 0;
    realtime.template = this.storedTemplate();
    this.mMqttService.publish('blesong', JSON.stringify(realtime));
  }

  resetSelection(): void {
    this.mSelectedBook.set(null);
    this.mSelectedChapter.set(null);
    this.mVerses.set([]);
    this.mVerseIndex.set(-1);
  }

  changeBible(): void {
    this.mSelectedBible.set(null);
    this.mBooks.set([]);
    this.mSelectedBook.set(null);
    this.mChapters.set([]);
    this.mSelectedChapter.set(null);
    this.mVerses.set([]);
    this.mVerseIndex.set(-1);
    localStorage.removeItem(STORAGE_BIBLE_KEY);
  }

  // ------------------------------------------------------------ upload / delete

  mUploading = signal<boolean>(false);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.bblx')) {
      this.mSToastService.danger('El archivo debe terminar en .bblx');
      return;
    }

    this.mUploading.set(true);
    const close = this.mSModalLoadingService.show();
    this.mBibleService.uploadBible(file).subscribe({
      next: () => {
        this.mSToastService.success(`Biblia "${file.name}" cargada`);
        this.loadBibles();
      },
      error: (err) => {
        const msg = err?.error?.msg ?? 'No se pudo cargar la biblia';
        this.mSToastService.danger(msg);
      },
    }).add(() => {
      this.mUploading.set(false);
      close.next();
    });
  }

  deleteBible(bible: BibleListItem, event: Event): void {
    event.stopPropagation();
    if (!confirm(`¿Eliminar la biblia "${bible.name}"?`)) return;

    const close = this.mSModalLoadingService.show();
    this.mBibleService.deleteBible(bible.idx).subscribe({
      next: () => {
        this.mSToastService.success('Biblia eliminada');
        if (this.mSelectedBible()?.idx === bible.idx) this.changeBible();
        this.loadBibles();
      },
      error: () => this.mSToastService.danger('No se pudo eliminar'),
    }).add(() => close.next());
  }
}
