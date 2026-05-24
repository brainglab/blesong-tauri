import { Component, HostListener, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { filter } from 'rxjs/operators';
import { ServerService } from 'src/app/services/server.service';
import { HPresenterObsNavbarComponent } from 'src/app/components/home/h-presenter-obs/h-presenter-obs-navbar/h-presenter-obs-navbar.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-shell',
  templateUrl: './app-shell.component.html',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgTemplateOutlet, LucideAngularModule, HPresenterObsNavbarComponent],
})
export class AppShellComponent implements OnInit {
  mServerIp = signal<string | null>(null);
  mServerPort = signal<number | null>(null);
  mDrawerOpen = signal<boolean>(false);
  mAppVersion = environment.app.version;

  constructor(private mServerService: ServerService, private mRouter: Router) {}

  ngOnInit(): void {
    this.mServerService.get().subscribe({
      next: (result: any) => {
        if (result?.ip && result?.port) {
          this.mServerIp.set(result.ip);
          this.mServerPort.set(result.port);
        }
      },
      error: () => {},
    });

    this.mRouter.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.mDrawerOpen.set(false));
  }

  @HostListener('document:keydown.escape')
  closeDrawer() {
    if (this.mDrawerOpen()) this.mDrawerOpen.set(false);
  }
}
