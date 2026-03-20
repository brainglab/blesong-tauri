import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'thousandSeparator'
})
export class ThousandSeparatorPipe implements PipeTransform {

  transform(value: number | string, mSymbol: string, mDecimalCount?: number): string {

    let res = "";

    if (value != null) {
      mDecimalCount = mDecimalCount == null ? 0 : mDecimalCount;
      let mSection = Number(value).toString().split('.');

      if (mSection.length > 1) {
        // 
        //   mDecimalCount = mSection[1].length;
        //   mDecimalCount = mDecimalCount <= 2 ? mDecimalCount : 1;

        // } else {
        //   mDecimalCount = 0
      }

      // 


      if (isNaN(Number(value))) {
        res = `${value.toString()}`;
        // 

      } else {
        // 

        res = `${new Intl.NumberFormat("es-CL", {
          maximumFractionDigits: mDecimalCount
        }).format(Number(value))}`;

      }
    } else {
      res = ''
      // 
    }

    // 

    return `${mSymbol} ${res}`;
  }

}
