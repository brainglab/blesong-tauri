import { Component } from '@angular/core';
import { HSidebarComponent } from '../h-sidebar/h-sidebar.component';
import { HNavbarComponent } from '../h-navbar/h-navbar.component';
import { HQrComponent } from '../h-qr/h-qr.component';

@Component({
    selector: 'app-h-qr-dashboard',
    templateUrl: './h-qr-dashboard.component.html',
    imports: [HSidebarComponent, HNavbarComponent, HQrComponent]
})
export class HQrDashboardComponent {

}
