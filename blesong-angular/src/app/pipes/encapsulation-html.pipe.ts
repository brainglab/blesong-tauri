import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

@Pipe({ name: "encapsulationHtml" })
export class EncapsulationHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) { }

  transform(value: any) {
    if (value != undefined) {
      let valueAux = value.trim().replace(/\n/g, '<br>');
      return this.sanitizer.bypassSecurityTrustHtml(valueAux);
    } else {
      return value;
    }
  }
}