import { Injectable } from '@angular/core';

export enum ValidationType { txtnum, txtnumWOspaces, integer, number, double, decimal, int, tinyint, bigint, boolean, coordinate, date, phone, url, varchar, text, datetime, ip, email, rut, token };

@Injectable({
  providedIn: 'root'
})
export class LibraryService {

  capitalizeFirstLetter(mValue: string) {
    return mValue.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  nameToAvatarLetter(mValue: string) {
    return mValue.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase()).join('');
  }

  validate(mType: ValidationType, mValue: string, mLenMin: number, mLenMax: number) {

    let mRegex = /^$/;
    switch (mType) {
      case ValidationType.txtnum: // text and numbers
        mRegex = /^[A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s]+[^\'\"]*$/
        break;
      case ValidationType.txtnumWOspaces: // text and numbers whitout spaces
        mRegex = /^[A-Za-zÁÉÍÓÚáéíóúñÑ0-9]+$/
        break;
      case ValidationType.decimal:
        mRegex = /^[0-9]+([.,][0-9]+)?$/
        break;
      case ValidationType.integer:
        mRegex = /^[0-9]+([.,][0-9]+)?$/
        break;
      case ValidationType.number:
        mRegex = /^[0-9]+([.,][0-9]+)?$/
        break;
      case ValidationType.double:
        mRegex = /^[0-9]+([.,][0-9]+)?$/
        break;
      case ValidationType.int:
        mRegex = /^[A-Za-z0-9-]+$/
        break;
      case ValidationType.tinyint:
        mRegex = /^[A-Za-z0-9-]+$/
        break;
      case ValidationType.bigint:
        mRegex = /^[0-9]+([.,][0-9]+)?$/
        break;
      case ValidationType.boolean:
        mRegex = /^(true|false)$/
        break;
      case ValidationType.coordinate:
        mRegex = /^(\-?\d+(\.\d+)?)$/
        break;
      case ValidationType.date:
        mRegex = /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/
        break;
      case ValidationType.phone:
        mRegex = /^\+[0-9]+([.,][0-9]+)?$/
        break
      case ValidationType.url:
        mRegex = /(([\w]+:)?\/\/)?(([\d\w]|%[a-fA-f\d]{2,2})+(:([\d\w]|%[a-fA-f\d]{2,2})+)?@)?([\d\w][-\d\w]{0,253}[\d\w]\.)+[\w]{2,63}(:[\d]+)?(\/([-+_~.\d\w]|%[a-fA-f\d]{2,2})*)*(\?(&?([-+_~.\d\w]|%[a-fA-f\d]{2,2})=?)*)?(#([-+_~.\d\w]|%[a-fA-f\d]{2,2})*)?/
        break;
      case ValidationType.varchar: // text and numbers
        mRegex = /^[A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/
        break;
      case ValidationType.text: // text and numbers
        mRegex = /^[A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/
        break;
      case ValidationType.datetime:
        mRegex = /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/
        break;
      case ValidationType.ip:

        break;
      case ValidationType.email:
        mRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        break;
      case ValidationType.rut:
        mRegex = /^[0-9]{5,12}([0-9]|k|K){1}$/
        break;
      case ValidationType.token:
        mRegex = /^[\w-]*\.[\w-]*\.[\w-]*$/
        break;
      default:
        mRegex = /^$/
        break
    }

    let mIsCorrect = true;
    if (!mRegex.test(mValue)) {
      mIsCorrect = false;
    } if (mValue.length < mLenMin || mValue.length > mLenMax) {
      mIsCorrect = false;
    }

    return mIsCorrect;
  }

  jsonToUrl(mObject: any) {
    let mString = JSON.stringify(mObject);
    mString = mString.replace(/"/g, '');
    mString = mString.replace(/{/g, '');
    mString = mString.replace(/}/g, '');
    mString = mString.replace(/,/g, '&');
    mString = mString.replace(/:/g, '=');
    return mString;
  }

  scrollTo(elem: string, offset: number) {
    const yOffset = offset;
    const element = document.querySelector(elem)!;
    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

    window.scrollTo({ top: y, behavior: 'smooth' })
  }





}