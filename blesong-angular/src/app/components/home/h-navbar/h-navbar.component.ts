import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-d-navbar',
  templateUrl: './h-navbar.component.html',
})
export class HNavbarComponent {
  mFileURL = environment.file.endpoint;
  mImageUrl: string = "";

  mSession: any = {};
  mName: string = '';
  mNameAvatar: string = '';

  mCompanies: any = [];
  mCompanySelected: any = {};

  constructor(private mRouter: Router) {

    let timeStamp = (new Date()).getTime();
    this.mImageUrl = `${this.mFileURL}${this.mSession.user_image_url}?t=${timeStamp}`;
  }

  ngOnInit(): void {
  }

  toogleMenu() {
    let menuIsOpen: any = '1';
    if (localStorage.getItem('mnv')) {
      menuIsOpen = localStorage.getItem('mnv')
    }

    // data-kt-aside-minimize="on"

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