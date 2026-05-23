import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'capitalize',
    standalone: false
})

export class CapitalizePipe implements PipeTransform {

  transform(value: string): string {
    if (value != undefined && value.length > 0) {
      value = value.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    return value;
  }
}