import { Component, OnInit, Input, Renderer2 } from '@angular/core';


@Component({
  selector: 'app-d-sidebar',
  templateUrl: './h-sidebar.component.html',
})
export class HSidebarComponent {
  @Input() mController: String = '';
  menuOpen: any = '-1';
  session: any = {};
  mCustomMenu: any = [];

  constructor(public mRenderer: Renderer2) {

  }

  ngOnInit(): void {
    this.buildMenu();
  }

  buildMenu() {

    // set configuration menumside
    this.mCustomMenu = [
      {
        title: "Dashboard",
        show: `true`,
        menu: [
          {
            title: "Inicio",
            icon: "fa-house",
            active: false,
            show: `true`,
            submenu: [
              {
                title: "Canciones",
                route: "/songs",
                controller: "songs",
                show: `true`,
              },
              {
                title: "Autores",
                route: "/autors",
                controller: "autors",
                show: `true`,
              },
            ]
          },
        ],
      }
    ];

    // active default for controller
    for (let i = 0; i < this.mCustomMenu.length; i++) {
      for (let j = 0; j < this.mCustomMenu[i].menu.length; j++) {
        for (let k = 0; k < this.mCustomMenu[i].menu[j].submenu.length; k++) {
          if (this.mCustomMenu[i].menu[j].submenu[k].controller == this.mController) {
            this.mCustomMenu[i].menu[j].active = true;
            break;
          }
        }
      }
    }

  }


}