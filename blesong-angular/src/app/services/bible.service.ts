import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface BibleListItem {
  idx: string;          // filename of the .bblx (e.g. "RV1960.bblx")
  name: string;         // Description from Details
  abreviation: string;
}

export interface BibleBookItem {
  idx: number;          // 1..66 canonical book id
  name: string;         // Spanish name
  testament: 'AT' | 'NT';
}

export interface BibleChapterItem {
  chapter: number;
}

export interface BibleVerseItem {
  verse: number;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class BibleService {

  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  constructor(private http: HttpClient) {}

  selection() {
    return this.http
      .post(`${environment.apiUrl}/bible_bibles/selection`, {}, this.httpOptions)
      .pipe(
        map((res: any) => res),
        catchError(err => throwError(() => err)),
      );
  }

  selectionBooks(bibleIdx: string) {
    return this.http
      .post(`${environment.apiUrl}/bible_bibles/selection_books`, { bible_bible_idx: bibleIdx }, this.httpOptions)
      .pipe(
        map((res: any) => res),
        catchError(err => throwError(() => err)),
      );
  }

  selectionChapters(bibleIdx: string, bookIdx: number) {
    return this.http
      .post(`${environment.apiUrl}/bible_bibles/selection_chapters`,
        { bible_bible_idx: bibleIdx, bible_book_idx: bookIdx }, this.httpOptions)
      .pipe(
        map((res: any) => res),
        catchError(err => throwError(() => err)),
      );
  }

  selectionVerses(bibleIdx: string, bookIdx: number, chapter: number) {
    return this.http
      .post(`${environment.apiUrl}/bible_bibles/selection_verses`,
        { bible_bible_idx: bibleIdx, bible_book_idx: bookIdx, bible_chapter_idx: String(chapter) },
        this.httpOptions)
      .pipe(
        map((res: any) => res),
        catchError(err => throwError(() => err)),
      );
  }

  uploadBible(file: File) {
    const url = `${environment.apiUrl}/bible_bibles/upload?filename=${encodeURIComponent(file.name)}`;
    return this.http
      .post(url, file, {
        headers: new HttpHeaders({ 'Content-Type': 'application/octet-stream' }),
      })
      .pipe(
        map((res: any) => res),
        catchError(err => throwError(() => err)),
      );
  }

  deleteBible(filename: string) {
    return this.http
      .post(`${environment.apiUrl}/bible_bibles/delete`,
        { bible_bible_idx: filename }, this.httpOptions)
      .pipe(
        map((res: any) => res),
        catchError(err => throwError(() => err)),
      );
  }
}
