import { Component, OnInit, Input, Output, EventEmitter, Renderer2 } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { UploadFileModel } from '../../../models/upload_file.model';
import { SToastService } from '../s-toast/s-toast.service';

@Component({
  selector: 'app-upload-file',
  templateUrl: './upload-file.component.html'
})
export class UploadFileComponent implements OnInit {

  @Input() mField: string;
  @Input() mAccept: String = 'image/*';
  @Output() mUpload = new EventEmitter<UploadFileModel>();
  @Output() mDelete = new EventEmitter<UploadFileModel>();


  uploadFile: string = '';

  uploadedFiles: Array<File>;
  mForm = new FormGroup({
    fileSource: new FormControl('', [Validators.required])
  });

  constructor(public mRenderer: Renderer2, private mSToastService: SToastService) {
    this.mUpload = new EventEmitter();
    this.mDelete = new EventEmitter();
    // 
  }

  ngOnInit() {

  }

  upload(event: any) {

    if (event.target.files.length > 0) {

      let mFile = event.target.files[0];
      const fileSize = mFile.size;


      const fileSizeInKB = Math.round(fileSize / 1024);
      const fileSizeInMB = Math.round(fileSizeInKB / 1024);

      if (fileSizeInMB >= 300) {
        this.mSToastService.danger('Atención!', 'El archivo debe tener como máximo 30MB de tamaño');

      } else {
        let mUploadFileModel = new UploadFileModel();
        mUploadFileModel.field = this.mField;
        mUploadFileModel.file = mFile;
        this.mUpload.emit(mUploadFileModel);
      }
    }
  }
}
