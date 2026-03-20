import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'format'
})

export class FormatPipe implements PipeTransform {

  transform(value: string, type: string): string {

    let result = ''
    switch (type) {
      case 'rut':
        let mPart = value.substring(0, value.length - 1);
        let res = `${new Intl.NumberFormat("es-CL", {
          maximumFractionDigits: 0
        }).format(Number(mPart))}`;

        result = `${res}-${value.substring(value.length - 1, value.length)}`;
        break;

      default:
        break;
    }

    return result;
  }
}