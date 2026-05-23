import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HQrComponent } from '../h-qr/h-qr.component';

@Component({
    selector: 'app-h-qr-menu-page',
    templateUrl: './h-qr-menu-page.component.html',
    imports: [RouterLink, HQrComponent]
})
export class HQrMenuPageComponent {

}
