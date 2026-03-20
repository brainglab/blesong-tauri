import { Component, EventEmitter, Output } from '@angular/core';
import { TemplateModel } from 'src/app/models/template.model';

@Component({
  selector: 'app-h-presenter-obs-navbar',
  templateUrl: './h-presenter-obs-navbar.component.html',
})
export class HPresenterObsNavbarComponent {

  @Output() mResponse: EventEmitter<any> = new EventEmitter<any>();
  mTemplate: TemplateModel = new TemplateModel();

  constructor() {
    this.getStoredTemplate();
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

  setAnimation(mIndex: number) {
    this.mTemplate.template_animation = mIndex;
    localStorage.setItem('mTemplate', JSON.stringify(this.mTemplate));
  }

  setFontSize(mAction: string) {
    this.getStoredTemplate();
    if (mAction === 'add') {
      this.mTemplate.template_body_fontsize = this.mTemplate.template_body_fontsize + 5;
    } else {
      this.mTemplate.template_body_fontsize = this.mTemplate.template_body_fontsize - 5;
    }
    localStorage.setItem('mTemplate', JSON.stringify(this.mTemplate));
  }

  sendStandBy() {
    this.mResponse.emit();
  }

  reload() {
    window.location.reload();
  }

}
