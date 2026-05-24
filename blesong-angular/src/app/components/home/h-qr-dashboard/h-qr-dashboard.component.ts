import { Component } from '@angular/core';
import { HQrComponent } from '../h-qr/h-qr.component';
import { PageHeaderComponent } from '../../../layout/page-header/page-header.component';

@Component({
    selector: 'app-h-qr-dashboard',
    templateUrl: './h-qr-dashboard.component.html',
    imports: [PageHeaderComponent, HQrComponent],
})
export class HQrDashboardComponent {

}
