import { Directive, HostListener } from '@angular/core';
import { NavigationService } from '../services/navigation.service';

@Directive({
  selector: '[backButton]'
})
export class BackButtonDirective {

  constructor(private mNavigationService: NavigationService) { }

  @HostListener('click')
  onClick(): void {
    this.mNavigationService.back();
  }

}