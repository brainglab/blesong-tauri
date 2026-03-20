import { Injectable } from '@angular/core'
import { Location } from '@angular/common'
import { Router, NavigationEnd } from '@angular/router'

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private history: string[] = []

  private static readonly MAX_HISTORY = 50;

  constructor(private router: Router, private location: Location) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.history.push(event.urlAfterRedirects);
        if (this.history.length > NavigationService.MAX_HISTORY) {
          this.history.splice(0, this.history.length - NavigationService.MAX_HISTORY);
        }
      }
    })
  }

  back(): void {
    this.history.pop();
    this.location.back()
  }
}