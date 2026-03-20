import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';

import readXlsxFile from 'read-excel-file';

import { LibraryService, ValidationType } from 'src/app/services/library.service';
import { SongModel } from 'src/app/models/song.model';
import { SModalLoadingService } from 'src/app/components/shared/s-modal-loading/s-modal-loading.service';
import { SongService } from 'src/app/services/song.service';
import { SToastService } from 'src/app/components/shared/s-toast/s-toast.service';

@Component({
  selector: 'app-d-load-song',
  standalone: false,

  templateUrl: './d-load-song.component.html'
})
export class DLoadSongComponent implements OnInit {

  @Input() mResponseEvent: Subject<boolean>;
  mShow: boolean = false;

  rows = [];
  messages = [];

  mTotalStep = 0;
  mStep = 0;
  mPercent = 0;

  mEventCloseGlobal = new Subject<void>();

  @ViewChild('list') list?: ElementRef<HTMLDivElement>;

  constructor(private mLibraryService: LibraryService, private elementRef: ElementRef, private mSToastService: SToastService,
    private mSModalLoadingService: SModalLoadingService, private mSongService: SongService) {

  }

  ngOnInit(): void {
    this.mShow = true;
    window.scroll(0, 0);
  }

  async upload(event: any) {

    if (event.target.files.length > 0) {

      let mFile = event.target.files[0];
      const fileSize = mFile.size;


      const fileSizeInKB = Math.round(fileSize / 1024);
      const fileSizeInMB = Math.round(fileSizeInKB / 1024);

      if (fileSizeInMB >= 300) {
        this.mSToastService.danger('El archivo debe tener como máximo 30MB de tamaño');

      } else {

        this.rows = await readXlsxFile(mFile)

        this.validateFile();

      }
    }
  }


  validateFile() {
    // field
    let mFieldSongName = 0
    let mFieldAutorIdx = 1
    let mFieldSongYear = 2
    let mFieldSongContent = 3


    // proccess
    let isFormatted = true;

    if (this.rows.length <= 1) {
      isFormatted = false;
      this.messages.push({ index: "Validación global", state: 0, message: "No hay registros para procesar" });

    } else {
      this.messages.push({ index: "Validación global", state: 1, message: "Tiene al menos una fila para procesar" });

      for (let i = 1; i < this.rows.length; i++) {

        const cols = this.rows[i];

        if (cols.length != 4) { // <--- total de columnas a validar
          isFormatted = false;
          this.messages.push({ index: `Fila ${i + 1}`, state: 0, message: "Tiene demaciadas columnas" });

        } else if (!this.mLibraryService.validate(ValidationType.varchar, this.rows[i][mFieldSongName], 1, 255)) { // validate song_name
          isFormatted = false;
          this.messages.push({ index: `Fila ${i}: Nombre ${this.rows[i][mFieldSongName]}`, state: 0, message: "Valor no válido" });
        } else if (!this.mLibraryService.validate(ValidationType.varchar, this.rows[i][mFieldAutorIdx], 1, 255)) { // validate autor_idx
          isFormatted = false;
          this.messages.push({ index: `Fila ${i}: Autor ${this.rows[i][mFieldAutorIdx]}`, state: 0, message: "Valor no válido" });
        } else if (!this.mLibraryService.validate(ValidationType.varchar, this.rows[i][mFieldSongYear], 1, 255)) { // validate song_year
          isFormatted = false;
          this.messages.push({ index: `Fila ${i}: Año ${this.rows[i][mFieldSongYear]}`, state: 0, message: "Valor no válido" });
        } else if (!this.mLibraryService.validate(ValidationType.text, this.rows[i][mFieldSongContent], 1, 255)) { // validate song_content
          isFormatted = false;
          this.messages.push({ index: `Fila ${i}: Contenido ${this.rows[i][mFieldSongContent]}`, state: 0, message: "Valor no válido" });
        }

      }
    }

    if (!isFormatted) {
      this.mSToastService.danger("Corrige los errores en la planilla, antes de cargar.");
    } else {
      this.mTotalStep = this.rows.length - 1;
      this.mStep = 1;

      this.processFile();
    }
  }

  processFile() {


    let mSong = new SongModel();

    mSong.song_name = this.rows[this.mStep][0].toString().trim();
    mSong.autor_idx = this.rows[this.mStep][1].toString().trim();
    mSong.song_year = this.rows[this.mStep][2].toString().trim();
    mSong.song_content = this.rows[this.mStep][3].toString().trim();


    // create object
    this.mSongService.create(mSong).subscribe({
      error: (err: any) => {

        switch (err.error['code']) {
          case '20':
            this.messages.push({ index: `Item ${this.mStep}`, state: 0, message: `Ya existe un registro parecido a este... No se pueden repetir los campos clave` });
            break;
          default:
            this.messages.push({ index: `Item ${this.mStep}`, state: 0, message: `Error inesperado` });
            break;
        }
      },
      next: (result: any) => {


        // result
        this.messages.push({ index: `Item ${this.mStep}`, state: 1, message: `Cargado con exito` });
      }

    }).add(() => {
      this.mPercent = Math.round((this.mStep / this.mTotalStep) * 100);

      const maxScroll = this.list?.nativeElement.scrollHeight;
      this.list?.nativeElement.scrollTo({ top: maxScroll, behavior: 'smooth' });


      if (this.mStep < this.mTotalStep) {
        this.mStep += 1;
        this.processFile();
      } else {
        this.mEventCloseGlobal.next();
      }
    });

  }

  close(mResponse: boolean) {
    this.mShow = false;

    let mTimeTwo = setTimeout(() => {
      this.elementRef.nativeElement.remove();
      clearInterval(mTimeTwo);
      this.mResponseEvent.next(mResponse);
    }, 400);
  }



}
