import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-d-navbar',
  templateUrl: './h-navbar.component.html',
})
export class HNavbarComponent implements OnInit {

  mSession: any = {};
  mName: string = '';
  mNameAvatar: string = '';

  mCompanies: any = [];
  mCompanySelected: any = {};

  constructor(private mRouter: Router) { }

  ngOnInit(): void {
  }

  toogleMenu() {
    let menuIsOpen: any = '1';
    if (localStorage.getItem('mnv')) {
      menuIsOpen = localStorage.getItem('mnv')
    }

    let mElement = document.getElementById("db-wrapper");
    if (menuIsOpen == '1') {
      mElement.classList.add("toggled");
      menuIsOpen = '0';
    } else {
      mElement.classList.remove("toggled");
      menuIsOpen = '1';
    }

    localStorage.setItem('mnv', menuIsOpen);
  }
}
