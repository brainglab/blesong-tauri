import { AfterViewInit, Component, ElementRef, HostListener, Input, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-s-modal-option',
  templateUrl: './s-modal-option.component.html',
  imports: [FormsModule, LucideAngularModule],
})
export class SModalOptionComponent implements OnInit, AfterViewInit {

  @Input() mTitle: string;
  @Input() mOptions: any[] = [];
  @Input() mField: string;
  @Input() mResponseEvent: Subject<any>;

  @ViewChild('mSearchInput') mSearchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('optionsList') optionsList?: ElementRef<HTMLDivElement>;

  // Signals for binding-critical state — keeps dev-mode CD double-check
  // stable when sibling dynamic views are being created/destroyed.
  mShow = signal<boolean>(false);
  mSearchText = signal<string>('');
  mFilteredOptions = signal<any[]>([]);
  mHighlight = signal<number>(0);

  ngOnInit(): void {
    this.mShow.set(true);
    this.mFilteredOptions.set([...this.mOptions]);
  }

  ngAfterViewInit(): void {
    this.mSearchInput?.nativeElement.focus();
  }

  filterOptions() {
    const q = this.mSearchText().trim().toLowerCase();
    const next = !q
      ? [...this.mOptions]
      : this.mOptions.filter(opt =>
          opt.name?.toLowerCase().includes(q) ||
          opt.description?.toLowerCase().includes(q)
        );
    this.mFilteredOptions.set(next);
    this.mHighlight.set(0);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (!this.mShow()) return;

    const options = this.mFilteredOptions();
    switch (event.key) {
      case 'ArrowDown':
        if (options.length === 0) return;
        event.preventDefault();
        this.mHighlight.set((this.mHighlight() + 1) % options.length);
        this.scrollHighlightIntoView();
        break;

      case 'ArrowUp':
        if (options.length === 0) return;
        event.preventDefault();
        this.mHighlight.set((this.mHighlight() - 1 + options.length) % options.length);
        this.scrollHighlightIntoView();
        break;

      case 'Enter':
        if (!options[this.mHighlight()]) return;
        event.preventDefault();
        this.close(options[this.mHighlight()].idx);
        break;

      case 'Escape':
        event.preventDefault();
        this.close(null);
        break;
    }
  }

  private scrollHighlightIntoView() {
    setTimeout(() => {
      const list = this.optionsList?.nativeElement;
      const item = list?.children[this.mHighlight()] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    });
  }

  close(mResponse: any) {
    this.mShow.set(false);
    setTimeout(() => this.mResponseEvent.next(mResponse), 200);
  }
}
